/*
    App > Models > Failed Request

    When other requests fail, an instance of Failed Request is created instead
    to store the error messages, so that we can return a helpful message when
    the user submits the token of the failed request.
*/

const debug = require('../lib/debug_helper')("failed_req");
const mongoose = require("mongoose");

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

// STATICS

// create a FailedRequest doc with given token and message,
// adding created_at/updated_at times
FailedRequestSchema.statics.createAndStamp = function(attrs) {
  debug.debug(`Creating FailedRequest with attrs ${JSON.stringify(attrs)}`);
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
  } else if(message === Object(message)) { // plain JS object ({})
    message = Object.entries(message).map(a => a.join(": ")).join(", ");
  } else { // others/primitives
    message = message.toString();
  }
  attrs.message = message;

  // return creation promise
  return this.create(attrs)
    .then( doc => {
      debug.debug(`FailedRequest create success with token ${doc.token}`);
      return doc;
    })
    .catch( e => {
      // catch DB create errors, log
      debug.error("Error when creating FailedRequest in createAndStamp:");
      debug.error(e);
      // & hide specifics from user (data may be sensitive)
      throw new Error("Something went wrong when saving request");
    });
};

// export Mongoose model
module.exports = mongoose.model('FailedRequest', FailedRequestSchema);
