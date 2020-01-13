/* eslint-disable no-unused-vars */
// Test framework libraries
const { expect } = require("chai");
//const sinon = require("sinon");

const { mockState, executeMiddleware } = require("../test-utils/express-shim");
const restFactory = require("../../middleware/restFactory");

describe.only("restFactory", () => {
  const mockReq = {
    headers: {
      host: "my-test.com",
    },
    url: "/foo",
  };

  function executeStack(...middleware) {
    const state = mockState(mockReq);
    return executeMiddleware(state, ...middleware);
  }

  // before(() => {
  //   restFactory.init({ 
  //     traceOn: true,
  //     errorLogger: err => console.trace(err) 
  //   });
  // });

  // after(() => {
  //   restFactory.init({ traceOn: false });
  // });

  describe("asyncServiceWrapper", () => {
    it("should throw an exception if the service is not async", () => {
      function service(req, ctrl) {
      }

      expect(() => 
        restFactory.asyncServiceWrapper(service)
      ).to.throw("asyncServiceWrapper must take an async function");
    });
  });

  describe("getResponse", () => {
    it("should send 200 OK for service that returns a result", () => {
      function returnResult(req, res, next) {
        res.locals.data = {
          test: 1234
        };
        next();
      }

      const result = executeStack(
        returnResult,
        restFactory.getResponse
      );

      expect(result.isSent).to.be.true;
      expect(result.status).to.equal(200);
      expect(result.body.success).to.be.true;
      expect(result.body.message).to.equal("OK");
      expect(result.body.data).to.be.ok;
      expect(result.body.data.test).to.equal(1234);
    });

    it("should send 200 OK if service returns no result", () => {
      function returnResult(req, res, next) {
        next();
      }

      const result = executeStack(
        returnResult,
        restFactory.getResponse
      );

      expect(result.isSent).to.be.true;
      expect(result.status).to.equal(200);
      expect(result.body.success).to.be.true;
      expect(result.body.message).to.equal("OK");
      expect(result.body.data).to.be.undefined;
    });

    it("should send 404 if service throws NotFoundError", () => {
      function throwNotFound(req, res, next) {
        throw new restFactory.NotFoundError("blarg");
      }

      const result = executeStack(
        throwNotFound,
        restFactory.getResponse
      );

      expect(result.isSent).to.be.true;
      expect(result.status).to.equal(404);
      expect(result.body.success).to.be.false;
      expect(result.body.message).to.equal("blarg");
      expect(result.body.data).to.be.undefined;
    });
  });

  describe("postResponse", () => {
    it("should send 201 Created for service that returns a result", () => {
      function returnResult(req, res, next) {
        res.locals.data = {
          test: 1234
        };
        next();
      }

      const result = executeStack(
        returnResult,
        restFactory.postResponse
      );

      expect(result.isSent).to.be.true;
      expect(result.status).to.equal(201);
      expect(Object.keys(result.headers).length).to.equal(0);
      expect(result.body.success).to.be.true;
      expect(result.body.message).to.equal("Created");
      expect(result.body.data).to.be.ok;
      expect(result.body.data.test).to.equal(1234);
    });

    it("should send 201 Created if service returns no result", () => {
      function returnResult(req, res, next) {
        next();
      }

      const result = executeStack(
        returnResult,
        restFactory.postResponse
      );

      expect(result.isSent).to.be.true;
      expect(result.status).to.equal(201);
      expect(Object.keys(result.headers).length).to.equal(0);
      expect(result.body.success).to.be.true;
      expect(result.body.message).to.equal("Created");
      expect(result.body.data).to.be.undefined;
    });

    it("should send 201 Created with location header from url", () => {
      function returnResult(req, res, next) {
        res.locals.url = "http://foo.com"
        res.locals.data = {
          test: 1234
        };
        next();
      }

      const result = executeStack(
        returnResult,
        restFactory.postResponse
      );

      expect(result.isSent).to.be.true;
      expect(result.status).to.equal(201);
      expect(result.headers["Location"]).to.equal("http://foo.com");
      expect(result.body.success).to.be.true;
      expect(result.body.message).to.equal("Created");
      expect(result.body.data).to.be.ok;
      expect(result.body.data.test).to.equal(1234);
    });

    it("should send 201 Created with location header from locationId", () => {
      function returnResult(req, res, next) {
        res.locals.locationId = 1234;
        res.locals.data = {
          test: 1234
        };
        next();
      }

      const result = executeStack(
        returnResult,
        restFactory.postResponse
      );

      expect(result.isSent).to.be.true;
      expect(result.status).to.equal(201);
      expect(result.headers["Location"]).to.equal("http://my-test.com/foo/1234");
      expect(result.body.success).to.be.true;
      expect(result.body.message).to.equal("Created");
      expect(result.body.data).to.be.ok;
      expect(result.body.data.test).to.equal(1234);
    });

    it("should send 404 if service throws NotFoundError", () => {
      function throwNotFound(req, res, next) {
        throw new restFactory.NotFoundError("blarg");
      }

      const result = executeStack(
        throwNotFound,
        restFactory.postResponse
      );

      expect(result.isSent).to.be.true;
      expect(result.status).to.equal(404);
      expect(result.body.success).to.be.false;
      expect(result.body.message).to.equal("blarg");
      expect(result.body.data).to.be.undefined;
    });
  });

  describe("putResponse", () => {
    it("should send 200 OK for service that returns a result", () => {
      function returnResult(req, res, next) {
        res.locals.data = {
          test: 1234
        };
        next();
      }

      const result = executeStack(
        returnResult,
        restFactory.getResponse
      );

      expect(result.isSent).to.be.true;
      expect(result.status).to.equal(200);
      expect(result.body.success).to.be.true;
      expect(result.body.message).to.equal("OK");
      expect(result.body.data).to.be.ok;
      expect(result.body.data.test).to.equal(1234);
    });

    it("should send 200 OK if service returns no result", () => {
      function returnResult(req, res, next) {
        next();
      }

      const result = executeStack(
        returnResult,
        restFactory.putResponse
      );

      expect(result.isSent).to.be.true;
      expect(result.status).to.equal(200);
      expect(result.body.success).to.be.true;
      expect(result.body.message).to.equal("OK");
      expect(result.body.data).to.be.undefined;
    });

    it("should send 404 if service throws NotFoundError", () => {
      function throwNotFound(req, res, next) {
        throw new restFactory.NotFoundError("blarg");
      }

      const result = executeStack(
        throwNotFound,
        restFactory.putResponse
      );

      expect(result.isSent).to.be.true;
      expect(result.status).to.equal(404);
      expect(result.body.success).to.be.false;
      expect(result.body.message).to.equal("blarg");
      expect(result.body.data).to.be.undefined;
    });
  });

  describe("deleteResponse", () => {
    it("should send 200 OK for service that returns a result", () => {
      function returnResult(req, res, next) {
        res.locals.data = {
          test: 1234
        };
        next();
      }

      const result = executeStack(
        returnResult,
        restFactory.deleteResponse
      );

      expect(result.isSent).to.be.true;
      expect(result.status).to.equal(200);
      expect(result.body.success).to.be.true;
      expect(result.body.message).to.equal("OK");
      expect(result.body.data).to.be.ok;
      expect(result.body.data.test).to.equal(1234);
    });

    it("should send 200 OK if service returns no result", () => {
      function returnResult(req, res, next) {
        next();
      }

      const result = executeStack(
        returnResult,
        restFactory.deleteResponse
      );

      expect(result.isSent).to.be.true;
      expect(result.status).to.equal(200);
      expect(result.body.success).to.be.true;
      expect(result.body.message).to.equal("OK");
      expect(result.body.data).to.be.undefined;
    });

    it("should send 404 if service throws NotFoundError", () => {
      function throwNotFound(req, res, next) {
        throw new restFactory.NotFoundError("blarg");
      }

      const result = executeStack(
        throwNotFound,
        restFactory.deleteResponse
      );

      expect(result.isSent).to.be.true;
      expect(result.status).to.equal(404);
      expect(result.body.success).to.be.false;
      expect(result.body.message).to.equal("blarg");
      expect(result.body.data).to.be.undefined;
    });
  });
});
