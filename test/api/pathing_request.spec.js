/*
    Test > API > Pathing Request

    Integration test for the API endpoints dealing with Pathing Request services.
*/

const request = require("supertest");
const sinon = require("sinon");

const uid_gen = require("../../app/lib/uid_helper");

const PathingRequest = require("../../app/models/pathing_request");
const FailedRequest = require("../../app/models/failed_request");

/// POST route test

describe("Pathing route", () => {
  let router_mount = "/route";
  let server, path;
  beforeEach(async () =>  {
    path = `${router_mount}`;
    server = await require("../../bin/www");
  });
  afterEach(async () =>
    await server.close()
  );

  /// POST route test

  describe(`POST ${router_mount}/`, () => {
    beforeEach(() => {
      path = `${path}/`;
    });
    let input_body;
    var action = async b => request(server).post(path).send(b);

    // valid request test

    context("with a valid input body", () => {
      let uid_gen_stub;
      let stubbed_token = "ABCDEFGH1234567";
      beforeEach(() => {
        input_body = [[1,2],[7,8]];
        uid_gen_stub = sinon.stub(uid_gen, "generate");
        uid_gen_stub.resolves(stubbed_token);
      });
      afterEach(() => {
        uid_gen_stub.restore();
      });

      it("returns 200 with an error message", async () => {
        let res = await action(input_body);
        expect(res.status).to.equal(200);
        expect(res.body).to.eql({token: stubbed_token});
      });
    });

    // invalid request tests

    context("with an invalid input_body", () => {
      beforeEach(() => {
        input_body = [[1,2],[2,3,3]];
      });
      it("returns 200 with an error message", async () => {
        let res = await action(input_body);
        expect(res.status).to.equal(200);
        expect(res.body).to.eql({error: "Invalid body input format"});
      });
    });

    context("with the wrong latitude/longitude range", () => {
      beforeEach(() => {
        input_body = [[1,2],[2,355]];
      });
      it("returns 200 with an error message", async () => {
        let res = await action(input_body);
        expect(res.status).to.equal(200);
        expect(res.body).to.eql({error: "Invalid body input format"});
      });
    });

    context("with too many points to process", () => {
      let API_POINT_LIMIT = 23;
      beforeEach(() => {
        input_body = Array(30).fill(1).map(i => [i, 2]);
      });
      it("returns 200 with an error message", async () => {
        let res = await action(input_body);
        expect(res.status).to.equal(200);
        expect(res.body).to.eql({error: `Too many points; maximum point count is ${API_POINT_LIMIT}`});
      });
    });
  });

  /// GET route test

  describe(`GET ${router_mount}/route/:token`, () => {
    beforeEach(() => {
      path = `${path}/`; // token is added in each context
    });
    let action = async () => request(server).get(path);

    context("with a valid token", () => {
      let token, doc;
      beforeEach(async () => {
        token = await uid_gen.generate();
        path = `${path}${token}`;
      });
      let successfulGET = async () => {
        res = await action();
        expect(res.status).to.equal(200);
        expect(res.body).to.eql(doc.toJSON());
      }

      context("for a request in-progress", () => {
        beforeEach(async () => {
          doc = await PathingRequest.create({
            token: token,
            status: "in progress",
            path: [[1,2],[3,4]]
          });
        });

        it("returns 200 and the correct JSON", successfulGET);
      });

      context("for a solved request", () => {
        beforeEach(async () => {
          doc = await PathingRequest.create({
            token: token,
            status: "success",
            path: [[1,2],[3,4]],
            total_distance: 1234,
            total_time: 5678
          });
        })

        it("returns 200 and the correct JSON", successfulGET);
      });

      context("for a failed request", () => {
        beforeEach(async () => {
          doc = await FailedRequest.create({
            token: token,
            message: "We have found an unexpected error. Please try again later."
          });
        });

        it("returns 200 and the correct JSON", successfulGET);
      });
    });


    context("with an invalid token", () => {
      beforeEach(() => {
        path = `${path}/ABCDEFGHIJKLMNOP`;
      });

      it("returns 404", async () => {
        let res = await action();
        expect(res.status).to.equal(404);
      });
    });
  });
});
