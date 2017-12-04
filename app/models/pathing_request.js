/*
    App > Models > Pathing Request

    A single request for drive route pathing. After success, reorders submitted
    path so that the end result is the shortest route possible. Also stores
    the total distance and time taken to drive said shortest route.
*/

var mongoose = require("mongoose");

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

// export Mongoose model
module.exports = mongoose.model('PathingRequest', PathingRequestSchema);
