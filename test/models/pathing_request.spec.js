/*
    Test > Models > Pathing Request

    Unit test for the Pathing Request model
*/

const sinon = require("sinon");

const PathingRequest = require("../../app/models/pathing_request");

describe("createAndStamp", () => {
  let now, sandbox, clock;
  beforeEach(async () =>  {
    await PathingRequest.remove().exec();
    now = new Date();
    sandbox = sinon.sandbox.create();
    clock = sinon.useFakeTimers(now.getTime());
  });
  afterEach(async () => {
    sandbox.restore();
    clock.restore();
  });

  it("adds timestamps & status", async () => {
    let attrs = {
      token: "WXYZ7890",
      path: [[1,2],[8,9]]
    };
    let doc = await PathingRequest.createAndStamp(attrs)
    expect(doc.token).to.equal(attrs.token);
    expect(doc.path).to.eql(attrs.path);
    expect(doc.created_at.getTime()).to.equal(now.getTime());
    expect(doc.updated_at.getTime()).to.equal(now.getTime());
    expect(doc.status).to.equal("in progress");
  });
});

describe("toJSON", () => {
  let doc;
  let base_attrs = {
      token: "WXYZ7890",
      path: [[1,2],[8,9]],
      total_distance: 600,
      total_time: 700
  };
  beforeEach(async () =>  {
    await PathingRequest.remove().exec();
  });

  context("when in progress", () => {
    beforeEach(async () => {
      doc = await PathingRequest.create(
        Object.assign({status: "in progress"}, base_attrs)
      );
    });
    it("only shows 'status: in progress'", () => {
      expect(doc.toJSON()).to.eql(
        {status: "in progress"}
      );
    });
  });

  context("when successful", () => {
    beforeEach(async () => {
      doc = await PathingRequest.create(
        Object.assign({status: "success"}, base_attrs)
      );
    });
    it("has status, path, total_distance, and total_time", () => {
      expect(doc.toJSON()).to.eql({
        status: "success",
        total_distance: base_attrs.total_distance,
        total_time: base_attrs.total_time,
        path: base_attrs.path
      });
    });
  });

  describe("concludeWith", () => {
    let now, sandbox, clock, update_clock;
    beforeEach(async () =>  {
      await PathingRequest.remove().exec();
      now = new Date();
      sandbox = sinon.sandbox.create();
      clock = sinon.useFakeTimers(now.getTime());
    });
    afterEach(async () => {
      sandbox.restore();
      clock.restore();
      update_clock.restore();
    });

    it("also changes status to success and changes updated_at", async () => {
      let attrs = {
        token: "WXYZ7890",
        path: [[1,2],[8,9]],
        total_distance: 600,
        total_time: 700,
        created_at: now,
        updated_at: now,
        status: "in progress"
      };
      let doc = await PathingRequest.create(attrs);
      expect(doc.token).to.equal(attrs.token);
      expect(doc.path).to.eql(attrs.path);
      expect(doc.created_at.getTime()).to.equal(now.getTime());
      expect(doc.updated_at.getTime()).to.equal(now.getTime());
      expect(doc.status).to.equal("in progress");


      // rig the timer to get a different time
      let old_get_time = now.getTime();
      now.setDate(now.getDate() + 1);
      let new_get_time = now.getTime();
      update_clock = sinon.useFakeTimers(now.getTime());

      // call concludeWith and refresh our document
      let new_attrs = {path: [[3,4],[6,7]]};
      await doc.concludeWith(new_attrs);
      doc = await PathingRequest.findOne({_id: doc._id});

      // check that attrs post-refresh fit our updated expectations
      expect(doc.path).to.eql(new_attrs.path);
      expect(doc.status).to.equal("success")
      expect(doc.updated_at.getTime()).to.equal(new_get_time);
      expect(doc.created_at.getTime()).to.equal(old_get_time);
    });
  });
});
