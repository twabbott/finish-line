/* eslint-disable no-unused-vars */
const { expect } = require("chai");

const repartee = require("../../middleware/repartee");
const { mockState, executeMiddleware } = require("../test-utils/express-shim");

// Not using repartee any more.  Good idea, but not a good idea.
describe("repartee", () => {
  const testMessage = "This is the message.";
  const testData = { a: "some string", b: 6, c: true };

  function buildResponse(...middleware) {
    return executeMiddleware(
      mockState(),
      repartee.responses(),       
      ...middleware);
  }

  describe("responses", () => {
    //////////////////////////////////////////////////////////////////////////////
    describe("200 ok()", () => {
      it("should return default 200 response", () => {
        function doOk(req, res, next) {
          res.ok();
        }
        const result = buildResponse(doOk);

        expect(result.status).to.equal(200);
        expect(result.body).to.not.be.undefined;
        expect(result.body.success).to.be.true;
        expect(result.body.message).to.be.equal(repartee.defaultMessages.ok);
        expect(result.body.data).to.be.undefined;
      });
    
      it("should return 200 response with message", () => {
        function doOk(req, res, next) {
          res.ok(undefined, testMessage);
        }
        const result = buildResponse(doOk);

        expect(result.status).to.equal(200);
        expect(result.body).to.not.be.undefined;
        expect(result.body.success).to.be.true;
        expect(result.body.message).to.be.equal(testMessage);
        expect(result.body.data).to.be.undefined;
      });
    
      it("should return 200 response with payload", () => {
        function doOk(req, res, next) {
          res.ok({...testData});
        }
        const result = buildResponse(doOk);

        expect(result.status).to.equal(200);
        expect(result.body).to.not.be.undefined;
        expect(result.body.success).to.be.true;
        expect(result.body.message).to.be.equal(repartee.defaultMessages.ok);
        expect(result.body.data).to.deep.equal(testData);
      });
    });

    //////////////////////////////////////////////////////////////////////////////
    describe("201 created()", () => {
      it("should return default 201 response", () => {
        function doCreated(req, res, next) {
          res.created(testData, 1234);
        }
        const result = buildResponse(doCreated);

        expect(result.status).to.equal(201);
        expect(result.headers.Location).to.equal("http://blah.com//1234");
        expect(result.body).to.not.be.undefined;
        expect(result.body.success).to.be.true;
        expect(result.body.message).to.be.equal(repartee.defaultMessages.created);
        expect(result.body.data).to.deep.equal(testData);
      });

      it("should return a 201 response with a message", () => {
        const testMsg = "Hello world";
        function doCreated(req, res, next) {
          res.created(testData, 1234, testMsg);
        }
        const result = buildResponse(doCreated);

        expect(result.status).to.equal(201);
        expect(result.headers.Location).to.equal("http://blah.com//1234");
        expect(result.body).to.not.be.undefined;
        expect(result.body.success).to.be.true;
        expect(result.body.message).to.be.equal(testMsg);
        expect(result.body.data).to.deep.equal(testData);
      });
    });

    //////////////////////////////////////////////////////////////////////////////
    describe("204 noContent()", () => {
      it("should return a 204 response", () => {
        function doNoContent(req, res, next) {
          res.noContent();
        }
        const result = buildResponse(doNoContent);

        expect(result.status).to.equal(204);
        expect(result.body).to.be.undefined;
      });
    });

    //////////////////////////////////////////////////////////////////////////////
    describe("400 badRequest()", () => {
      it("should return default 400 response", () => {
        function doError(req, res, next) {
          res.badRequest();
        }
        const result = buildResponse(doError);
    
        expect(result.status).to.equal(400);
        expect(result.body).to.not.be.undefined;
        expect(result.body.success).to.be.false;
        expect(result.body.message).to.be.equal(repartee.defaultMessages.badRequest);
        expect(result.body.data).to.be.undefined;
      });
    
      it("should return 400 response with message", () => {
        function doError(req, res, next) {
          res.badRequest(testMessage);
        }
        const result = buildResponse(doError);
    
        expect(result.status).to.equal(400);
        expect(result.body).to.not.be.undefined;
        expect(result.body.success).to.be.false;
        expect(result.body.message).to.be.equal(testMessage);
        expect(result.body.data).to.be.undefined;
      });
    });

    //////////////////////////////////////////////////////////////////////////////
    describe("401 unauthorized()", () => {
      it("should return default 401 response", () => {
        function doError(req, res, next) {
          res.unauthorized(testMessage);
        }
        const result = buildResponse(doError);
    
        expect(result.status).to.equal(401);
        expect(result.body).to.not.be.undefined;
        expect(result.body.success).to.be.false;
        expect(result.body.message).to.be.equal(repartee.defaultMessages.unauthorized);
        expect(result.body.data).to.be.undefined;
      });
    
      it("should return 401 response with message", () => {
        function doError(req, res, next) {
          res.unauthorized(null, testMessage);
        }
        const result = buildResponse(doError);
    
        expect(result.status).to.equal(401);
        expect(result.body).to.not.be.undefined;
        expect(result.body.success).to.be.false;
        expect(result.body.message).to.be.equal(testMessage);
        expect(result.body.data).to.be.undefined;
      });
    
      it("should return 401 response with WWW-Authenticate challenge", () => {
        function doError(req, res, next) {
          res.unauthorized(null, testMessage);
        }
        const result = buildResponse(doError);
    
        expect(result.status).to.equal(401);
        expect(result.body).to.not.be.undefined;
        expect(result.body.success).to.be.false;
        expect(result.body.message).to.be.equal(testMessage);
        expect(result.body.data).to.be.undefined;
      });
    });

    //////////////////////////////////////////////////////////////////////////////
    describe("403 forbidden()", () => {
      it("should return default 403 response", () => {
        function doError(req, res, next) {
          res.forbidden();
        }
        const result = buildResponse(doError);
    
        expect(result.status).to.equal(403);
        expect(result.body).to.not.be.undefined;
        expect(result.body.success).to.be.false;
        expect(result.body.message).to.be.equal(repartee.defaultMessages.forbidden);
        expect(result.body.data).to.be.undefined;
      });
    
      it("should return 403 response with message", () => {
        function doError(req, res, next) {
          res.forbidden(testMessage);
        }
        const result = buildResponse(doError);
    
        expect(result.status).to.equal(403);
        expect(result.body).to.not.be.undefined;
        expect(result.body.success).to.be.false;
        expect(result.body.message).to.be.equal(testMessage);
        expect(result.body.data).to.be.undefined;
      });
    });

    //////////////////////////////////////////////////////////////////////////////
    describe("404 notFound()", () => {
      it("should return default 404 response", () => {
        function doError(req, res, next) {
          res.notFound();
        }
        const result = buildResponse(doError);
    
        expect(result.status).to.equal(404);
        expect(result.body).to.not.be.undefined;
        expect(result.body.success).to.be.false;
        expect(result.body.message).to.be.equal(repartee.defaultMessages.notFound);
        expect(result.body.data).to.be.undefined;
      });
    
      it("should return 404 response with message", () => {
        function doError(req, res, next) {
          res.notFound(testMessage);
        }
        const result = buildResponse(doError);

        expect(result.status).to.equal(404);
        expect(result.body).to.not.be.undefined;
        expect(result.body.success).to.be.false;
        expect(result.body.message).to.be.equal(testMessage);
        expect(result.body.data).to.be.undefined;
      });
    });

    //////////////////////////////////////////////////////////////////////////////
    describe("405 methodNotAllowed()", () => {
      it("should return default 405 response", () => {
        function doError(req, res, next) {
          res.methodNotAllowed();
        }
        const result = buildResponse(doError);
    
        expect(result.status).to.equal(405);
        expect(result.body).to.not.be.undefined;
        expect(result.body.success).to.be.false;
        expect(result.body.message).to.be.equal(repartee.defaultMessages.methodNotAllowed);
        expect(result.body.data).to.be.undefined;
      });
    
      it("should return 405 response with message", () => {
        function doError(req, res, next) {
          res.methodNotAllowed(testMessage);
        }
        const result = buildResponse(doError);
    
        expect(result.status).to.equal(405);
        expect(result.body).to.not.be.undefined;
        expect(result.body.success).to.be.false;
        expect(result.body.message).to.be.equal(testMessage);
        expect(result.body.data).to.be.undefined;
      });
    });

    //////////////////////////////////////////////////////////////////////////////
    describe("409 conflict()", () => {
      it("should return default 409 response", () => {
        function doError(req, res, next) {
          res.conflict();
        }
        const result = buildResponse(doError);
    
        expect(result.status).to.equal(409);
        expect(result.body).to.not.be.undefined;
        expect(result.body.success).to.be.false;
        expect(result.body.message).to.be.equal(repartee.defaultMessages.conflict);
        expect(result.body.data).to.be.undefined;
      });
    
      it("should return 409 response with message", () => {
        function doError(req, res, next) {
          res.conflict(testMessage);
        }
        const result = buildResponse(doError);
    
        expect(result.status).to.equal(409);
        expect(result.body).to.not.be.undefined;
        expect(result.body.success).to.be.false;
        expect(result.body.message).to.be.equal(testMessage);
        expect(result.body.data).to.be.undefined;
      });
    });

    //////////////////////////////////////////////////////////////////////////////
    describe("500 internalServerError()", () => {
      it("should return default 500 response", () => {
        function doError(req, res, next) {
          res.internalServerError();
        }
        const result = buildResponse(doError);
    
        expect(result.status).to.equal(500);
        expect(result.body).to.not.be.undefined;
        expect(result.body.success).to.be.false;
        expect(result.body.message).to.be.equal(repartee.defaultMessages.internalServerError);
        expect(result.body.data).to.be.undefined;
      });
    
      it("should return 500 response with message", () => {
        function doError(req, res, next) {
          res.internalServerError(testMessage);
        }
        const result = buildResponse(doError);
    
        expect(result.status).to.equal(500);
        expect(result.body).to.not.be.undefined;
        expect(result.body.success).to.be.false;
        expect(result.body.message).to.be.equal(testMessage);
        expect(result.body.data).to.be.undefined;
      });
    });

    //////////////////////////////////////////////////////////////////////////////
    describe("errorResponse()", () => {
      it("should return status code 999 and test message", () => {
        function doError(req, res, next) {
          res.errorResponse(999, testMessage);
        }
        const result = buildResponse(doError);
    
        expect(result.status).to.equal(999);
        expect(result.body).to.not.be.undefined;
        expect(result.body.success).to.be.false;
        expect(result.body.message).to.be.equal(testMessage);
        expect(result.body.data).to.be.undefined;
      });
    });
  });

  describe("utilities", () => {
    describe ("successPayload()", () => {
      it("should make a proper success payload with default message", () => {
        const result = repartee.utilities.successPayload({...testData});

        expect(result.success).to.be.true;
        expect(result.data).to.deep.equal(testData);
        expect(result.message).to.equal(repartee.defaultMessages.ok);
      });

      it("should make a proper success payload with given message", () => {
        const result = repartee.utilities.successPayload({...testData}, testMessage);

        expect(result.success).to.be.true;
        expect(result.data).to.deep.equal(testData);
        expect(result.message).to.equal(testMessage);
      });
    });

    describe("errorPayload()", () => {
      it("should make a proper errur payload with default message", () => {
        const result = repartee.utilities.errorPayload(testMessage);

        expect(result.success).to.be.false;
        expect(result.data).to.be.undefined;
        expect(result.message).to.equal(testMessage);
      });
    });

    describe("wwwAuthenticateChallenge()", () => {
      it ("should return a string directly", () => {
        let result = repartee.utilities.wwwAuthenticateChallenge(testMessage);
        expect(result).to.equal(testMessage);
      });

      it("should throw an exception for unknown/missing challenge type", () => {
        expect(() => repartee.utilities.wwwAuthenticateChallenge())
          .to.throw("Error processing challengeOptions.  Parameter must be an object or a string.");
      });

      describe("challengeOptions", () => {
        it("should return scheme without parameters", () => {
          const options = {
            scheme: "Whatever"
          };

          let result = repartee.utilities.wwwAuthenticateChallenge(options);
          expect(result).to.equal("Whatever");
        });
  
        it("should return scheme with parameters", () => {
          const options = {
            scheme: "Whatever",
            realm: testMessage,
            charset: "UTF-8",
            numValue: 123,
            boolValue: true
          };

          let result = repartee.utilities.wwwAuthenticateChallenge(options);
          expect(result).to.equal(`Whatever realm="${testMessage}", charset="UTF-8", numValue=123, boolValue=true`);
        });

        it("should captialize first letter of scheme (convert \"bearer\" to \"Bearer\")", () => {
          const options = {
            scheme: "bearer"
          };

          let result = repartee.utilities.wwwAuthenticateChallenge(options);
          expect(result).to.equal("Bearer");
        });

        it("should throw an exception is scheme not specified", () => {
          const options = {};

          expect(() => repartee.utilities.wwwAuthenticateChallenge(options))
            .to.throw("challengeOptions parameter missing \"scheme\" property.");
        });

        it("should throw an exception for invalid property type", () => {
          const options = {
            scheme: "xxx",
            xxx: undefined
          };

          expect(() => repartee.utilities.wwwAuthenticateChallenge(options))
            .to.throw("Error processing field \"xxx\" in challengeOptions.  Value must be string, number, or boolean.");
        });
      });
    });
  });
});
