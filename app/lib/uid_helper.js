/*
    App > Lib > Uid Helper

    Encapsulate uid generator creation & settings throughout app.
*/

// Default is a 128-bit UID encoded in base58
var uid_gen = new (require('uid-generator'))();

module.exports = uid_gen;
