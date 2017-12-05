/*
    App > Models > Pathing Request

    A single request for drive route pathing. After success, reorders submitted
    path so that the end result is the shortest route possible. Also stores
    the total distance and time taken to drive said shortest route.
*/
const debug = require('../lib/debug_helper')("pathing_req");
const mongoose = require("mongoose");

var PathingRequestSchema = new mongoose.Schema({
  // unique token for identifying request
  token: {
    type: String,
    unique: true,
    required: true,
  },

  // contains submitted path array for a request in progress,
  // and the final path order for a successful request
  path: {
    type: [[Number]],
    required: true
  },

  // denotes the current status of the request
  status: {
    type: String,
    enum: ["in progress", "success"], // upon failure, a FailedRequest is created instead
    default: "in progress",
    required: true
  },

  // total distance & time for a successful request; empty when in progress
  total_distance: {
    type: Number,
    min: 0
  },
  total_time: {
    type: Number,
    min: 0
  }
},
{
  timestamps: {
    createdAt: 'created_at',
    updatedAt: "updated_at"
  }
});

// for adding pre-save validation to unique fields, e.g. token
PathingRequestSchema.plugin(require('mongoose-unique-validator'));

// set toJSON to hide fields when status "in progress"
PathingRequestSchema.set('toJSON', {
  transform: (doc, ret) =>
    ret.status == "in progress" ?
    {
      status: "in progress"
    } :
    {
      status: "success",
      path: ret.path,
      total_distance: ret.total_distance,
      total_time: ret.total_time
    }
});

// STATICS

// create PathingRequest with given token and path,
// adding status and created_at/updated_at times
PathingRequestSchema.statics.createAndStamp = function (attrs) {
  debug.debug(`Creating PathingRequest with token ${attrs.token}`);
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
  return this.create(attrs)
    .then( doc => {
      debug.debug(`PathingRequest create success with token ${doc.token}`);
      return doc;
    })
    .catch( e => {
      // catch DB create errors, log
      debug.error("Error when creating PathingRequest in createAndStamp:");
      debug.error(e);
      // & hide specifics from user (data may be sensitive)
      throw new Error("Something went wrong when saving request");
    });
};

// INSTANCE METHODS

PathingRequestSchema.methods.concludeWith = function(new_path) {
  let new_attrs = Object.assign(
    {},
    new_path,
    {status: "success", updated_at: new Date()}
  );

  return this.update(new_attrs)
    .then( update_stats => {
      debug.debug(`Updated PathingRequest with token ${this.token} with solved best path`);
      return update_stats;
    })
    .catch( e => {
      // catch DB update errors, log
      debug.error("Error when updating PathingRequest in concludeWith:");
      debug.error(e);
      // & hide specifics from user (data may be sensitive)
      throw new Error("Something went wrong when solving request");
    });
};



// export Mongoose model
module.exports = mongoose.model('PathingRequest', PathingRequestSchema);
