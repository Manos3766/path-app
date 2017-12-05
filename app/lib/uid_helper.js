/*
    App > Lib > Uid Helper

    Encapsulate uid generator creation & settings throughout app.
*/

// https://www.npmjs.com/package/uid-generator
const UIDGenerator = require('uid-generator');

module.exports = new UIDGenerator(

  // bitSize - not used, we use uidLength option below instead
  null,

  // baseEncoding - all ASCI characters that do not need URI encoding
  UIDGenerator.BASE66,

  // uidLength - number of characters to generate
  36
);
