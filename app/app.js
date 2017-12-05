/*
    App > App

    Sets up the app, called by bin/www

*/

const debug = require("../app/lib/debug_helper")("app");

//------------------
// SET UP EXPRESS INSTANCE & CONFIG
//------------------

var app = require("express")();
const config = require(`./config/${process.env.NODE_ENV || 'development'}`);

//-------------
// SET UP DB
//-------------

// get DB url
const db_url = config.db_url;

// set up Mongoose
var mongoose = require("mongoose");
mongoose.Promise = global.Promise;
mongoose.connect(db_url, { useMongoClient: true });
mongoose.connection.on('error', (err) => {
  debug.error("Mongoose connection error:");
  debug.error(err);
});

//----------------------
// SET UP BODY PARSER MIDDLEWARE
//----------------------

let bodyParser = require('body-parser');
app.use(bodyParser.json());

// currently not used - add back if specification extends to accept url
// app.use(bodyParser.urlencoded({ extended: false }));

//-----------------
// SET UP ROUTES
//-----------------

app.use('/route', require('./routes/pathing_request'));

//-----------------
// FINALLY, EXPORT APP
//-----------------

module.exports = app;
