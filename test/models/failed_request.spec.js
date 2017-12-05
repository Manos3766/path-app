/*
    Test > Models > Failed Request

    Unit test for the Failed Request model
*/

const sinon = require("sinon");

const FailedRequest = require("../../app/models/failed_request");

describe("createAndStamp", () => {
  let now, sandbox, clock;
  beforeEach(async () =>  {
    await FailedRequest.remove().exec();
    now = new Date();
    sandbox = sinon.sandbox.create();
    clock = sinon.useFakeTimers(now.getTime());
  });
  afterEach(async () => {
    sandbox.restore();
    clock.restore();
  });

  it("adds timestamps", async () => {
    let attrs = {
      token: "WXYZ7890",
      message: "This is a test message 123678"
    }
    let doc = await FailedRequest.createAndStamp(attrs)
    expect(doc.token).to.equal(attrs.token);
    expect(doc.message).to.equal(attrs.message);
    expect(doc.created_at.getTime()).to.equal(now.getTime());
    expect(doc.updated_at.getTime()).to.equal(now.getTime());
  });
});

describe("toJSON", () => {
  beforeEach(async () =>  {
    await FailedRequest.remove().exec();
  });

  it("presents 'message' attribute as 'error'", async () => {
    let attrs = {
      token: "WXYZ7890",
      message: "This is a test message 123678"
    }
    let doc = await FailedRequest.create(attrs)
    expect(doc.token).to.equal(attrs.token);
    expect(doc.message).to.equal(attrs.message);
    expect(doc.toJSON().error).to.equal(attrs.message);
  });
});
