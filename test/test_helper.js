/*
    Test > Test Helper

    All config and setups that need to be run before tests.
*/

let chai = require("chai");

chai.config.includeStack = true; // turn on stack trace

global.expect = chai.expect;
global.AssertionError = chai.AssertionError;
global.Assertion = chai.Assertion;
global.assert = chai.assert;
