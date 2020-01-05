const { expect } = require("chai");

const repartee = require("../../middleware/repartee");
const { mockState } = require("../test-utils/express-shim");

describe("repartee", () => {
  const testMessage = "This is the message.";
  const testData = { a: "some string", b: 6, c: true };

  function buildResponse(mockReq, mockRes, mockNext) {
    const middleware = repartee.responses();

    const [req, res, next] = mockState(mockReq, mockRes, mockNext);

    middleware(req, res, next);

    return res;
  }

  describe("responses", () => {
    //////////////////////////////////////////////////////////////////////////////
    describe("200 ok()", () => {
      it("should return default 200 response", () => {
        const mockRes = buildResponse();
    
        mockRes.ok();
    
        expect(mockRes.finalResponse.status).to.equal(200);
        expect(mockRes.finalResponse.body).to.not.be.undefined;
        expect(mockRes.finalResponse.body.success).to.be.true;
        expect(mockRes.finalResponse.body.message).to.be.equal(repartee.defaultMessages.ok);
        expect(mockRes.finalResponse.body.data).to.be.undefined;
      });
    
      it("should return 200 response with message", () => {
        const mockRes = buildResponse();
    
        mockRes.ok(undefined, testMessage);
    
        expect(mockRes.finalResponse.status).to.equal(200);
        expect(mockRes.finalResponse.body).to.not.be.undefined;
        expect(mockRes.finalResponse.body.success).to.be.true;
        expect(mockRes.finalResponse.body.message).to.be.equal(testMessage);
        expect(mockRes.finalResponse.body.data).to.be.undefined;
      });
    
      it("should return 200 response with payload", () => {
        const mockRes = buildResponse();
    
        mockRes.ok({...testData});
    
        expect(mockRes.finalResponse.status).to.equal(200);
        expect(mockRes.finalResponse.body).to.not.be.undefined;
        expect(mockRes.finalResponse.body.success).to.be.true;
        expect(mockRes.finalResponse.body.message).to.be.equal(repartee.defaultMessages.ok);
        expect(mockRes.finalResponse.body.data).to.deep.equal(testData);
      });
    });

    //////////////////////////////////////////////////////////////////////////////
    describe("201 created()", () => {
      it("should return default 201 response", () => {
        const mockReq = {
          headers: {
            host: "my-test.com",
          },
          url: "/foo",
        };
        const mockRes = buildResponse(mockReq);
    
        mockRes.created(testData, 1234);
    
        expect(mockRes.finalResponse.status).to.equal(201);
        expect(mockRes.finalResponse.headers.Location).to.equal("http://my-test.com/foo/1234");
        expect(mockRes.finalResponse.body).to.not.be.undefined;
        expect(mockRes.finalResponse.body.success).to.be.true;
        expect(mockRes.finalResponse.body.message).to.be.equal(repartee.defaultMessages.created);
        expect(mockRes.finalResponse.body.data).to.deep.equal(testData);
      });

      it("should return a 201 response with a message", () => {
        const mockReq = {
          headers: {
            host: "my-test.com",
          },
          url: "/foo",
        };
        const mockRes = buildResponse(mockReq);
        const testMsg = "Hello world";

        mockRes.created(testData, 1234, testMsg);
    
        expect(mockRes.finalResponse.status).to.equal(201);
        expect(mockRes.finalResponse.headers.Location).to.equal("http://my-test.com/foo/1234");
        expect(mockRes.finalResponse.body).to.not.be.undefined;
        expect(mockRes.finalResponse.body.success).to.be.true;
        expect(mockRes.finalResponse.body.message).to.be.equal(testMsg);
        expect(mockRes.finalResponse.body.data).to.deep.equal(testData);
      });
    });

    //////////////////////////////////////////////////////////////////////////////
    describe("204 noContent()", () => {
      it("should return a 204 response", () => {
        const mockRes = buildResponse();

        mockRes.noContent();
    
        expect(mockRes.finalResponse.status).to.equal(204);
        expect(mockRes.finalResponse.body).to.be.undefined;
      });
    });

    //////////////////////////////////////////////////////////////////////////////
    describe("400 badRequest()", () => {
      it("should return default 400 response", () => {
        const mockRes = buildResponse();
    
        mockRes.badRequest();
    
        expect(mockRes.finalResponse.status).to.equal(400);
        expect(mockRes.finalResponse.body).to.not.be.undefined;
        expect(mockRes.finalResponse.body.success).to.be.false;
        expect(mockRes.finalResponse.body.message).to.be.equal(repartee.defaultMessages.badRequest);
        expect(mockRes.finalResponse.body.data).to.be.undefined;
      });
    
      it("should return 400 response with message", () => {
        const mockRes = buildResponse();
    
        mockRes.badRequest(testMessage);
    
        expect(mockRes.finalResponse.status).to.equal(400);
        expect(mockRes.finalResponse.body).to.not.be.undefined;
        expect(mockRes.finalResponse.body.success).to.be.false;
        expect(mockRes.finalResponse.body.message).to.be.equal(testMessage);
        expect(mockRes.finalResponse.body.data).to.be.undefined;
      });
    });

    //////////////////////////////////////////////////////////////////////////////
    describe("401 unauthorized()", () => {
      it("should return default 401 response", () => {
        const mockRes = buildResponse();
    
        mockRes.unauthorized();
    
        expect(mockRes.finalResponse.status).to.equal(401);
        expect(mockRes.finalResponse.body).to.not.be.undefined;
        expect(mockRes.finalResponse.body.success).to.be.false;
        expect(mockRes.finalResponse.body.message).to.be.equal(repartee.defaultMessages.unauthorized);
        expect(mockRes.finalResponse.body.data).to.be.undefined;
      });
    
      it("should return 401 response with message", () => {
        const mockRes = buildResponse();
    
        mockRes.unauthorized(null, testMessage);
    
        expect(mockRes.finalResponse.status).to.equal(401);
        expect(mockRes.finalResponse.body).to.not.be.undefined;
        expect(mockRes.finalResponse.body.success).to.be.false;
        expect(mockRes.finalResponse.body.message).to.be.equal(testMessage);
        expect(mockRes.finalResponse.body.data).to.be.undefined;
      });
    
      it("should return 401 response with WWW-Authenticate challenge", () => {
        const mockRes = buildResponse();
        mockRes.unauthorized(null, testMessage);
    
        expect(mockRes.finalResponse.status).to.equal(401);
        expect(mockRes.finalResponse.body).to.not.be.undefined;
        expect(mockRes.finalResponse.body.success).to.be.false;
        expect(mockRes.finalResponse.body.message).to.be.equal(testMessage);
        expect(mockRes.finalResponse.body.data).to.be.undefined;
      });
    });

    //////////////////////////////////////////////////////////////////////////////
    describe("403 forbidden()", () => {
      it("should return default 403 response", () => {
        const mockRes = buildResponse();
    
        mockRes.forbidden();
    
        expect(mockRes.finalResponse.status).to.equal(403);
        expect(mockRes.finalResponse.body).to.not.be.undefined;
        expect(mockRes.finalResponse.body.success).to.be.false;
        expect(mockRes.finalResponse.body.message).to.be.equal(repartee.defaultMessages.forbidden);
        expect(mockRes.finalResponse.body.data).to.be.undefined;
      });
    
      it("should return 403 response with message", () => {
        const mockRes = buildResponse();
    
        mockRes.forbidden(testMessage);
    
        expect(mockRes.finalResponse.status).to.equal(403);
        expect(mockRes.finalResponse.body).to.not.be.undefined;
        expect(mockRes.finalResponse.body.success).to.be.false;
        expect(mockRes.finalResponse.body.message).to.be.equal(testMessage);
        expect(mockRes.finalResponse.body.data).to.be.undefined;
      });
    });

    //////////////////////////////////////////////////////////////////////////////
    describe("404 notFound()", () => {
      it("should return default 404 response", () => {
        const mockRes = buildResponse();
    
        mockRes.notFound();
    
        expect(mockRes.finalResponse.status).to.equal(404);
        expect(mockRes.finalResponse.body).to.not.be.undefined;
        expect(mockRes.finalResponse.body.success).to.be.false;
        expect(mockRes.finalResponse.body.message).to.be.equal(repartee.defaultMessages.notFound);
        expect(mockRes.finalResponse.body.data).to.be.undefined;
      });
    
      it("should return 404 response with message", () => {
        const mockRes = buildResponse();
    
        mockRes.notFound(testMessage);
    
        expect(mockRes.finalResponse.status).to.equal(404);
        expect(mockRes.finalResponse.body).to.not.be.undefined;
        expect(mockRes.finalResponse.body.success).to.be.false;
        expect(mockRes.finalResponse.body.message).to.be.equal(testMessage);
        expect(mockRes.finalResponse.body.data).to.be.undefined;
      });
    });

    //////////////////////////////////////////////////////////////////////////////
    describe("405 methodNotAllowed()", () => {
      it("should return default 405 response", () => {
        const mockRes = buildResponse();
    
        mockRes.methodNotAllowed();
    
        expect(mockRes.finalResponse.status).to.equal(405);
        expect(mockRes.finalResponse.body).to.not.be.undefined;
        expect(mockRes.finalResponse.body.success).to.be.false;
        expect(mockRes.finalResponse.body.message).to.be.equal(repartee.defaultMessages.methodNotAllowed);
        expect(mockRes.finalResponse.body.data).to.be.undefined;
      });
    
      it("should return 405 response with message", () => {
        const mockRes = buildResponse();
    
        mockRes.methodNotAllowed(testMessage);
    
        expect(mockRes.finalResponse.status).to.equal(405);
        expect(mockRes.finalResponse.body).to.not.be.undefined;
        expect(mockRes.finalResponse.body.success).to.be.false;
        expect(mockRes.finalResponse.body.message).to.be.equal(testMessage);
        expect(mockRes.finalResponse.body.data).to.be.undefined;
      });
    });

    //////////////////////////////////////////////////////////////////////////////
    describe("409 conflict()", () => {
      it("should return default 409 response", () => {
        const mockRes = buildResponse();
    
        mockRes.conflict();
    
        expect(mockRes.finalResponse.status).to.equal(409);
        expect(mockRes.finalResponse.body).to.not.be.undefined;
        expect(mockRes.finalResponse.body.success).to.be.false;
        expect(mockRes.finalResponse.body.message).to.be.equal(repartee.defaultMessages.conflict);
        expect(mockRes.finalResponse.body.data).to.be.undefined;
      });
    
      it("should return 409 response with message", () => {
        const mockRes = buildResponse();
    
        mockRes.conflict(testMessage);
    
        expect(mockRes.finalResponse.status).to.equal(409);
        expect(mockRes.finalResponse.body).to.not.be.undefined;
        expect(mockRes.finalResponse.body.success).to.be.false;
        expect(mockRes.finalResponse.body.message).to.be.equal(testMessage);
        expect(mockRes.finalResponse.body.data).to.be.undefined;
      });
    });

    //////////////////////////////////////////////////////////////////////////////
    describe("500 internalServerError()", () => {
      it("should return default 500 response", () => {
        const mockRes = buildResponse();
    
        mockRes.internalServerError();
    
        expect(mockRes.finalResponse.status).to.equal(500);
        expect(mockRes.finalResponse.body).to.not.be.undefined;
        expect(mockRes.finalResponse.body.success).to.be.false;
        expect(mockRes.finalResponse.body.message).to.be.equal(repartee.defaultMessages.internalServerError);
        expect(mockRes.finalResponse.body.data).to.be.undefined;
      });
    
      it("should return 500 response with message", () => {
        const mockRes = buildResponse();
    
        mockRes.internalServerError(testMessage);
    
        expect(mockRes.finalResponse.status).to.equal(500);
        expect(mockRes.finalResponse.body).to.not.be.undefined;
        expect(mockRes.finalResponse.body.success).to.be.false;
        expect(mockRes.finalResponse.body.message).to.be.equal(testMessage);
        expect(mockRes.finalResponse.body.data).to.be.undefined;
      });
    });

    //////////////////////////////////////////////////////////////////////////////
    describe("errorResponse()", () => {
      it("should return status code 999 and test message", () => {
        const mockRes = buildResponse();
    
        mockRes.errorResponse(999, testMessage);
    
        expect(mockRes.finalResponse.status).to.equal(999);
        expect(mockRes.finalResponse.body).to.not.be.undefined;
        expect(mockRes.finalResponse.body.success).to.be.false;
        expect(mockRes.finalResponse.body.message).to.be.equal(testMessage);
        expect(mockRes.finalResponse.body.data).to.be.undefined;
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
