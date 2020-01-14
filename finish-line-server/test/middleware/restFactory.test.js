/* eslint-disable no-unused-vars */
// Test framework libraries
const { expect } = require("chai");
//const sinon = require("sinon");

const { mockState, executeMiddleware } = require("../test-utils/express-shim");
const restFactory = require("../../middleware/restFactory");

describe("restFactory", () => {
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

//   before(() => {
//     restFactory.init({ 
// //      traceOn: true,
//       errorLogger: err => console.trace(err) 
//     });
//   });

  // after(() => {
  //   restFactory.init({ traceOn: false });
  // });

  describe("service", () => {
    describe("serviceWrapper", () => {
      it("call() should return a 200 for normal behavior", () => {
        function normalService(req, ctrl) {
          return {
            test: 1234
          };
        }
  
        const result = executeStack(
          restFactory.serviceWrapper.call(normalService),
          restFactory.getResponse
        );
  
        expect(result.isSent).to.be.true;
        expect(result.status).to.equal(200);
        expect(result.body.success).to.be.true;
        expect(result.body.message).to.equal("OK");
        expect(result.body.data).to.be.ok;
        expect(result.body.data.test).to.equal(1234);
      });

      it("call() should return a 404 for a NotFoundError", () => {
        function throwNotFound(req, ctrl) {
          throw new restFactory.NotFoundError("blarg");
        }
  
        const result = executeStack(
          restFactory.serviceWrapper.call(throwNotFound),
          restFactory.getResponse
        );
  
        expect(result.isSent).to.be.true;
        expect(result.status).to.equal(404);
        expect(result.body.success).to.be.false;
        expect(result.body.message).to.equal("blarg");
        expect(result.body.data).to.be.undefined;
      });
  
      it("call() should throw an exception if the service is async", () => {
        async function service(req, ctrl) {
        }
  
        expect(() => 
          restFactory.serviceWrapper.call(service)
        ).to.throw("serviceWrapper.call() can not take an async function");
      });

      it("callAsync() should return a 200 for normal behavior", (done) => {
        async function normalService(req, ctrl) {
          return {
            test: 1234
          };
        }
  
        const result = executeStack(
          restFactory.serviceWrapper.callAsync(normalService),
          restFactory.getResponse
        );
  
        setTimeout(() => {
          expect(result.isSent).to.be.true;
          expect(result.status).to.equal(200);
          expect(result.body.success).to.be.true;
          expect(result.body.message).to.equal("OK");
          expect(result.body.data).to.be.ok;
          expect(result.body.data.test).to.equal(1234);
          done();
        }, 30);
      });

      it("callAsync() should return a 404 for a NotFoundError", (done) => {
        async function throwNotFound(req, ctrl) {
          throw new restFactory.NotFoundError("blarg");
        }
  
        const result = executeStack(
          restFactory.serviceWrapper.callAsync(throwNotFound),
          restFactory.getResponse
        );
  
        setTimeout(() => {
          expect(result.isSent).to.be.true;
          expect(result.status).to.equal(404);
          expect(result.body.success).to.be.false;
          expect(result.body.message).to.equal("blarg");
          expect(result.body.data).to.be.undefined;
          done();
        }, 30);
      });

      it("callAsync() should throw an exception if the service is not async", () => {
        function service(req, ctrl) {
        }
  
        expect(() => 
          restFactory.serviceWrapper.callAsync(service)
        ).to.throw("serviceWrapper.callAsync() must take an async function");
      });
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

  describe("challengeOptions()", () => {
    it("should do default challenge options if no parameters given", () => {
      const result = restFactory.challengeOptions();

      expect(result).to.deep.equal({
        scheme: "Bearer"
      });
    });

    it("should set bearer and realm", () => {
      const result = restFactory.challengeOptions("Basic", "The kingdom of Krull");

      expect(result).to.deep.equal({
        scheme: "Basic",
        realm: "The kingdom of Krull"
      });
    });

    it("should set bearer, realm, and options", () => {
      const result = restFactory.challengeOptions(
        "Basic", 
        "The kingdom of Krull",
        { charset: "UTF-8" }
      );

      expect(result).to.deep.equal({
        scheme: "Basic",
        realm: "The kingdom of Krull",
        charset: "UTF-8"
      });
    });
  });

  describe("handleErrors", () => {
    it("should handle a RequestError with message", () => {
      function throwError(req, res, next) {
        throw new restFactory.RequestError("blarg");
      }

      const result = executeStack(
        throwError,
        restFactory.getResponse
      );

      expect(result.isSent).to.be.true;
      expect(result.status).to.equal(400);
      expect(result.body.success).to.be.false;
      expect(result.body.message).to.equal("blarg");
      expect(result.body.data).to.be.undefined;
      expect(result.body.errors).to.be.undefined;
    });

    it("should handle a RequestError with message and status code", () => {
      function throwError(req, res, next) {
        throw new restFactory.RequestError("blarg", 999);
      }

      const result = executeStack(
        throwError,
        restFactory.getResponse
      );

      expect(result.isSent).to.be.true;
      expect(result.status).to.equal(999);
      expect(result.body.success).to.be.false;
      expect(result.body.message).to.equal("blarg");
      expect(result.body.data).to.be.undefined;
      expect(result.body.errors).to.be.undefined;
    });

    it("should handle a RequestError with single error message", () => {
      function throwError(req, res, next) {
        throw new restFactory.RequestError("blarg", 999, "bad");
      }

      const result = executeStack(
        throwError,
        restFactory.getResponse
      );

      expect(result.isSent).to.be.true;
      expect(result.status).to.equal(999);
      expect(result.body.success).to.be.false;
      expect(result.body.message).to.equal("blarg");
      expect(result.body.data).to.be.undefined;
      expect(Array.isArray(result.body.errors)).to.be.true;
      expect(result.body.errors[0]).to.equal("bad");
    });

    it("should handle a RequestError with multiple error messages", () => {
      function throwError(req, res, next) {
        throw new restFactory.RequestError("blarg", 999, ["bad", "request"]);
      }

      const result = executeStack(
        throwError,
        restFactory.getResponse
      );

      expect(result.isSent).to.be.true;
      expect(result.status).to.equal(999);
      expect(result.body.success).to.be.false;
      expect(result.body.message).to.equal("blarg");
      expect(result.body.data).to.be.undefined;
      expect(Array.isArray(result.body.errors)).to.be.true;
      expect(result.body.errors[0]).to.equal("bad");
      expect(result.body.errors[1]).to.equal("request");
    });

    it("should handle a BadRequestError", () => {
      function throwError(req, res, next) {
        throw new restFactory.BadRequestError("blarg");
      }

      const result = executeStack(
        throwError,
        restFactory.getResponse
      );

      expect(result.isSent).to.be.true;
      expect(result.status).to.equal(400);
      expect(result.body.success).to.be.false;
      expect(result.body.message).to.equal("blarg");
      expect(result.body.data).to.be.undefined;
    });

    it("should handle a UnauthorizedError", () => {
      function throwError(req, res, next) {
        throw new restFactory.UnauthorizedError("blarg");
      }

      const result = executeStack(
        throwError,
        restFactory.getResponse
      );

      expect(result.isSent).to.be.true;
      expect(result.status).to.equal(401);
      expect(result.headers["WWW-Authenticate"]).to.be.undefined;
      expect(result.body.success).to.be.false;
      expect(result.body.message).to.equal("blarg");
      expect(result.body.data).to.be.undefined;
    });

    it("should handle a UnauthorizedError with challenge object", () => {
      function throwError(req, res, next) {
        throw new restFactory.UnauthorizedError("blarg", { scheme: "Bearer", realm: "my-realm", count: 16, flag: true });
      }

      const result = executeStack(
        throwError,
        restFactory.getResponse
      );

      expect(result.isSent).to.be.true;
      expect(result.status).to.equal(401);
      expect(result.headers["WWW-Authenticate"]).to.equal("Bearer realm=\"my-realm\", count=16, flag=true");
      expect(result.body.success).to.be.false;
      expect(result.body.message).to.equal("blarg");
      expect(result.body.data).to.be.undefined;
    });

    it("should handle a UnauthorizedError with challenge string", () => {
      function throwError(req, res, next) {
        throw new restFactory.UnauthorizedError("blarg", "Bearer realm=\"foo\"");
      }

      const result = executeStack(
        throwError,
        restFactory.getResponse
      );

      expect(result.isSent).to.be.true;
      expect(result.status).to.equal(401);
      expect(result.headers["WWW-Authenticate"]).to.equal("Bearer realm=\"foo\"");
      expect(result.body.success).to.be.false;
      expect(result.body.message).to.equal("blarg");
      expect(result.body.data).to.be.undefined;
    });

    it("should handle a UnauthorizedError with challenge built using challengeOptions()", () => {
      function throwError(req, res, next) {
        const challenge = restFactory.challengeOptions("Bearer", "foo", { count: 16, flag: true });
        throw new restFactory.UnauthorizedError("blarg", challenge);
      }

      const result = executeStack(
        throwError,
        restFactory.getResponse
      );

      expect(result.isSent).to.be.true;
      expect(result.status).to.equal(401);
      expect(result.headers["WWW-Authenticate"]).to.equal("Bearer realm=\"foo\", count=16, flag=true");
      expect(result.body.success).to.be.false;
      expect(result.body.message).to.equal("blarg");
      expect(result.body.data).to.be.undefined;
    });

    it("should handle a UnauthorizedError with challenge object with invalid data", () => {
      function throwError(req, res, next) {
        throw new restFactory.UnauthorizedError("blarg", { scheme: "Bearer", data: ["foo"] });
      }

      const result = executeStack(
        throwError,
        restFactory.getResponse
      );

      expect(result.isSent).to.be.true;
      expect(result.status).to.equal(401);
      expect(result.headers["WWW-Authenticate"]).to.be.undefined;
      expect(result.body.success).to.be.false;
      expect(result.body.message).to.equal("blarg");
      expect(result.body.data).to.be.undefined;
    });

    it("should handle a ForbiddenError", () => {
      function throwError(req, res, next) {
        throw new restFactory.ForbiddenError("blarg");
      }

      const result = executeStack(
        throwError,
        restFactory.getResponse
      );

      expect(result.isSent).to.be.true;
      expect(result.status).to.equal(403);
      expect(result.body.success).to.be.false;
      expect(result.body.message).to.equal("blarg");
      expect(result.body.data).to.be.undefined;
    });

    it("should handle a NotFoundError", () => {
      function throwError(req, res, next) {
        throw new restFactory.NotFoundError("blarg");
      }

      const result = executeStack(
        throwError,
        restFactory.getResponse
      );

      expect(result.isSent).to.be.true;
      expect(result.status).to.equal(404);
      expect(result.body.success).to.be.false;
      expect(result.body.message).to.equal("blarg");
      expect(result.body.data).to.be.undefined;
    });

    it("should respond with a 500 for any other error", () => {
      function throwError(req, res, next) {
        throw new Error("blarg");
      }

      const result = executeStack(
        throwError,
        restFactory.getResponse
      );

      expect(result.isSent).to.be.true;
      expect(result.status).to.equal(500);
      expect(result.body.success).to.be.false;
      expect(result.body.message).to.equal("blarg");
      expect(result.body.data).to.be.undefined;
    });
  })
});
