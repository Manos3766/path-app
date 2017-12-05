/*
    App > Controllers > Pathing Request Controller

    Action implementation for drive pathing services,
    e.g. shortest driving paths and estimated times.
*/

// set up models
const PathingRequest = require("../models/pathing_request");
const FailedRequest = require("../models/failed_request");

// instantiate helpers & clients
const uid_gen = require("../lib/uid_helper");
const debug = require('../lib/debug_helper')("path_ctrl");
const googleMapsClient =
  require('@google/maps').createClient({
    key: process.env.G_API_KEY,
    Promise: Promise
  });

// set relevant constants
const API_POINT_LIMIT = 23;

/*---------------------------------------------
 * Pathing controller actions
 ---------------------------------------------*/



 // get information of a specific pathing request with given token
 exports.getPathingRequest = function(req, res) {
   debug.info("getPathingRequest called via route GET "+req.originalUrl);
   let attrs = { token: req.params.token };

   // find PathingRequest with given token
   PathingRequest.findOne(attrs).exec()
   .then( doc => {
     // if found, pass doc; otherwise try to find FailedRequest doc
     return doc ? doc : FailedRequest.findOne(attrs).exec();
   })
   .then( doc => {
     // if any type of doc found, return it; otherwise send 404
     debug.debug(doc ? "Found, returning doc" : "Doc not found");
     doc ?
       res.json(doc.toJSON()) :
       res.sendStatus(404);
     return doc;
   })
   .catch( err => {
     // if any error, e.g. DB connection, send 500 if not replied yet
     res.headersSent ? "" : res.sendStatus(500);
     // then log error
     debug.error("Error in getPathingRequest:");
     debug.error(err);
   });
 };



// submit a new pathing request
exports.submitPathingRequest = function(req, res) {
    debug.info("submitPathingRequest called via route POST "+req.originalUrl);
  // if submitted path has invalid format, return 200 with error message as json
  if ( !validatePath(req.body) ) {
    res.json({ error: "Invalid body input format" });
    debug.debug("Rejecting request due to invalid body input format");
    return;
  // else if path length is larger than the API_POINT_LIMIT, also complain
  } else if ( req.body.length > API_POINT_LIMIT ) {
    res.json({ error: "Too many points; maximum point count is " + API_POINT_LIMIT });
    debug.debug("Rejecting request for exceeding API point count limit");
    return;
  }

  // attempt to generate a token
  uid_gen.generate()
  .then( token => {
    // if generated successfully, return copy of token to user
    debug.debug("Generated token "+token+", replying user");
    res.json({ token: token });
    return token; // & pass token below for follow-up
  })
  .catch( e => {
    // else if something went wrong, return 500
    res.status(500).json({ error: "Error generating request token" });
    throw {err: e}; // then throw (handled by last catch below)
  })

  // if token was generated successfully
  .then( token => {
    return Promise.all([
      // try to save a new PathingRequest doc AND
      createPathingRequest({token: token, path: req.body}),
      // start solving pathing problem
      findBestRouteAndStats(req.body)
    ])
    .then(([doc, solution]) => {
      // after both are done, update saved doc with the best solution
      let new_attrs = Object.assign(
        {},
        solution,
        {status: "success", updated_at: new Date()}
      );
      return doc.update(new_attrs)
      .then( update_stats => {
        debug.debug("Updated PathingRequest with token "+doc.token+" with solved best path");
        return update_stats;
      })
    }).catch(e => { // catch, wrap, & pass any errors
      throw {token: token, err: e};
    });
  }).catch(token_and_err => {
    // first, log error
    debug.error("submitPathingRequest has encountered an error:");
    debug.error(token_and_err.err);

    // then, if the error occurred after a token was sent to the user,
    if (token_and_err.token) {
      // create a FailedRequest doc, so that if the user tries to fetch the request
      // with the token in the future, we can return a helpful error message
      // instead of returning a 404. E.g. errors with MongoDB or Google API calls
      debug.warn("creating FailedRequest to preserve message for request with token "+token_and_err.token);
      createFailedRequest({token: token_and_err.token, err: token_and_err.err});
    }
    // else, error happened before a token is generated & sent to user; do nothing
  });
};



/*---------------------------------------------
 * functions for actions - these are hoisted up
 ---------------------------------------------*/



// validation for submitted path data:
function validatePath(path) {
  // path should be an array, and
  return (path instanceof Array) &&
    // its elements must also be arrays,
    path.reduce( (flag, coord) => {
      let num_coord = coord.map(l => Number(String(l)));
      return (num_coord instanceof Array) &&
        // each containing exactly 2 numbers
        num_coord.length == 2 &&
        num_coord.every(l => !isNaN(l)) &&
        // with valid latitude & longitude values
        (num_coord[0]>=-90 && num_coord[0]<=90) &&
        (num_coord[1]>=-180 && num_coord[1]<=180) &&
        flag; // (this is just for reduce)
    }, true);
}



// create PathingRequest with given token and path,
// adding status and created_at/updated_at times
function createPathingRequest(attrs) {
  debug.debug("Creating PathingRequest with token "+attrs.token);
  let time = new Date();
  attrs = Object.assign(
    {},
    attrs,
    {
      status: "in progress",
      created_at: time,
      updated_at: time
    }
  );

  // return creation promise
  return PathingRequest.create(attrs)
  .then( doc => {
    debug.debug("PathingRequest with token "+doc.token+" created");
    return doc;
  })
  .catch( e => {
    // catch DB create errors, log
    debug.error("Error when creating PathingRequest:");
    debug.error(e);
    // & hide specifics from user (data may be sensitive)
    throw new Error("Something went wrong when saving request");
  });
}



// create a FailedRequest doc with given token and message,
// adding created_at/updated_at times
function createFailedRequest(attrs) {
  debug.debug("Creating FailedRequest with token "+attrs.token);
  let time = new Date();
  attrs = Object.assign(
    {},
    attrs,
    {
      created_at: time,
      updated_at: time
    }
  );

  // handle different cases of thrown items
  let message = attrs.message;
  if(!message) {
    message = "Unknown error encountered";
  } else if(message instanceof Array) { // array
    message = message.join(", ");
  } else if(Object.entries(message)) { // plain JS object ({})
    message = Object.entries(message).map(a => a.join(": ")).join(", ");
  } else { // others/primitives
    message = message.toString();
  }
  attrs.message = message;

  // return creation promise
  return FailedRequest.create(attrs)
  .then( doc => {
    debug.debug("FailedRequest with token "+doc.token+" created");
    return doc;
  })
  .catch( e => {
    // catch DB create errors, log
    debug.error("Error when creating FailedRequest:");
    debug.error(e);
    // & hide specifics from user (data may be sensitive)
    throw new Error("Something went wrong when saving request");
  });
}



// find best route and return its relevant values
function findBestRouteAndStats(path) {
  debug.info("Launching "+(path.length-1)+" Directions API requests");
  // separate origin from the other points
  let origin = path[0];
  let points = path.slice(1);

  // make multiple parameter objects,
  let params_batch = points.map(
    (v, i) => // one for each non-origin point 'v'.
    ({
      units: "metric",
      mode: "driving",
      origin: origin,
      // set 'v' as the destination
      destination: v,
      // and use other points except 'v' as waypoints to optimize
      waypoints: points.filter((x,y) => y!= i),
      optimize: true
    })
  );

  return Promise.all(
    // send each param object as a Google Directions API request
    params_batch.map(b => googleMapsClient.directions(b).asPromise())
  )
  // then once all are done,
  .then( results => {
    debug.debug("Directions API requests all returned");
    // get total distance of each result
    let total_distances = results.map( resp =>
      // for each result, there's only one route object
      // (we only set 1 destination per request)
      resp.json.routes[0]
          .legs // each route object has multiple steps, or 'legs'
          .map(v => v.distance.value) // get each leg's distance value
          .reduce((a, b) => a + b) // and add them to get total sum
    );

    // then find which request has the shortest distance
    let best_index = total_distances.reduce(
      (best_i, val, cur_i) => (val < total_distances[best_i]) ? cur_i :best_i,
      0
    );

    // & get its relevant values, formatted as PathingRequest doc attributes
    let best_route = results[best_index].json.routes[0];
    let best_params = params_batch[best_index];
    return {
      total_distance: total_distances[best_index],
      // same as total_distance calculation, but for total duration
      total_time: best_route.legs.map(v => v.duration.value).reduce((a, b) => a + b),
      // update path to the optimized order given to us by the best result
      path: [].concat(
        [best_params.origin],
        best_route.waypoint_order.map(i => best_params.waypoints[i]),
        [best_params.destination]
      )
    };
  }).catch( e => {
    // catch API call errors, log
    debug.error("Error when sending/resolving Google API calls:");
    debug.error(e);
    // & hide specifics from user (data may be sensitive)
    throw new Error("Something went wrong when querying Google");
  });
}
