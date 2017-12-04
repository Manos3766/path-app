/*
    App > Routes > Pathing Request

    Route group associated with drive pathing services,
    e.g. shortest driving paths and estimated times.
*/

var router = require("express").Router();
var PathingRequestController = require("../controllers/pathing_request_controller");

/// PATHING ROUTES ///

router.get('/:token',
  PathingRequestController
    .getPathingRequest
);

router.post('/',
  PathingRequestController
    .submitPathingRequest
);

/// export Router object ///

module.exports = router;
