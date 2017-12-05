/*
    Test > Models > Uid Helper

    Unit test for the uid generator helper
*/


var uid_gen = require("../../app/lib/uid_helper");

describe("UID Generator", () => {

  it("should generate a 36-character token", async () => {
    let token = await uid_gen.generate();

    expect(token.length).equal(36);
  });
});
