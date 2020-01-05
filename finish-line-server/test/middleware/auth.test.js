// Test framework libraries
const { expect } = require("chai");
const sinon = require("sinon");

// Local dependencies
const repartee = require("../../middleware/repartee");
const { mockState } = require("../test-utils/express-shim");

// Mocked modules
const jwt = require("jsonwebtoken");

// Module under test
const { validateToken } = require("../../middleware/auth");

describe("auth", () => {
  const testEmail = "nobody@nowhere.com";
  const testUser = { username: testEmail };

  sinon.stub(jwt, "verify").returns(testUser);

  function buildState(mockReq, mockRes, mockNext) {
    const state = mockState(mockReq, mockRes, mockNext);

    // Add repartee
    repartee.responses()(...state);

    return state;
  }

  it("should authorize with a valid token", () => {
    const mockReq = {
      headers: {
        authorization: "Bearer 12345"
      }
    };

    const [req, res, next] = buildState(mockReq);

    validateToken(req, res, next);

    expect(req.user).to.be.ok;
    expect(req.user.username).to.equal(testEmail);
  });

  it("should respond with 401 if token is missing", () => {
    const mockReq = {
      headers: {
      }
    };

    const [req, res, next] = buildState(mockReq);

    validateToken(req, res, next);

    expect(req.user).to.be.undefined;
    
    expect(res.finalResponse.status).to.equal(401);
    expect(res.finalResponse.body.message).to.be.equal("User not authenticated.");
  });

  it("should respond with 401 if token type is not \"Bearer\"", () => {
    const mockReq = {
      headers: {
        authorization: "xxx 12345"
      }
    };

    const [req, res, next] = buildState(mockReq);

    validateToken(req, res, next);

    expect(req.user).to.be.undefined;
    
    expect(res.finalResponse.status).to.equal(401);
    expect(res.finalResponse.body.message).to.be.equal("Bearer token expected.");
  });

  it("should respond with 401 if token is invalid", () => {
    const mockReq = {
      headers: {
        authorization: "Bearer 12345"
      }
    };

    jwt.verify.restore(); // Get rid of old stub.
    sinon.stub(jwt, "verify").throws("Nope!");

    const [req, res, next] = buildState(mockReq);

    validateToken(req, res, next);

    expect(req.user).to.be.undefined;
    
    expect(res.finalResponse.status).to.equal(401);
    expect(res.finalResponse.body.message).to.be.equal("Invalid token.");
  });
});
