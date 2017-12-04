/*
    App > Models > Failed Request

    When other requests fail, an instance of Failed Request is created instead
    to store the error messages, so that we can return a helpful message when
    the user submits the token of the failed request.
*/

var mongoose = require("mongoose");

var FailedRequestSchema = new mongoose.Schema({
  // unique token for identifying request
  token: {
    type: String,
    unique: true,
    required: true,
  },

  // store error messages
  message: {
    type: String,
    required: true
  }
},
{
  timestamps: {
    createdAt: 'created_at',
    updatedAt: "updated_at"
  }
});

// for adding pre-save validation to unique fields, e.g. token
FailedRequestSchema.plugin(require('mongoose-unique-validator'));

// set toJSON
FailedRequestSchema.set('toJSON', {
  transform: (doc, ret) =>
    ({
      status: "failure",
      error: ret.message
    })
});

// export Mongoose model
module.exports = mongoose.model('FailedRequest', FailedRequestSchema);
