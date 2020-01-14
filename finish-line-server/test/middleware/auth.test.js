// Test framework libraries
const { expect } = require("chai");
const sinon = require("sinon");

// Local dependencies
const { mockState, executeMiddleware } = require("../test-utils/express-shim");

// Mocked modules
const jwt = require("jsonwebtoken");

// Module under test
const { validateToken } = require("../../middleware/auth");

describe.only("auth", () => {
  const testEmail = "nobody@nowhere.com";
  const testUser = { username: testEmail };

  sinon.stub(jwt, "verify").returns(testUser);

  function executeStack(authHeader, ...middleware) {
    const mockReq = {
      headers: {
        host: "my-test.com",
      },
      url: "/foo",
    };

    if (authHeader) {
      mockReq.headers.authorization = authHeader;
    }
  
    const state = mockState(mockReq);
    return executeMiddleware(state, ...middleware);
  }

  it("should authorize with a valid token", () => {
    let request = undefined;
    function testMiddleware(req, res, next) {
      request = req;
      next();
    }

    const response = executeStack("Bearer 12345", validateToken, testMiddleware);

    expect(response.isSent).to.be.false;
    expect(request.user).to.be.ok;
    expect(request.user.username).to.equal(testEmail);
  });

  it("should respond with 401 if token is missing", () => {
    let request = undefined;
    function testMiddleware(req, res, next) {
      request = req;
      next();
    }

    const response = executeStack(undefined, validateToken, testMiddleware);

    expect(request).to.be.undefined;
    
    expect(response.isSent).to.be.true;
    expect(response.status).to.equal(401);
    expect(response.headers["WWW-Authenticate"]).to.equal("Bearer realm=\"Finish line\"");
    expect(response.body.message).to.be.equal("User not authenticated.");
  });

  it("should respond with 401 if token type is not \"Bearer\"", () => {
    let request = undefined;
    function testMiddleware(req, res, next) {
      request = req;
      next();
    }

    const response = executeStack("xxx 12345", validateToken, testMiddleware);

    expect(request).to.be.undefined;
    
    expect(response.isSent).to.be.true;
    expect(response.status).to.equal(401);
    expect(response.headers["WWW-Authenticate"]).to.equal("Bearer realm=\"Finish line\"");
    expect(response.body.message).to.be.equal("Bearer token expected.");
  });

  it("should respond with 401 if token is invalid", () => {
    let request = undefined;
    function testMiddleware(req, res, next) {
      request = req;
      next();
    }

    jwt.verify.restore(); // Get rid of old stub.
    sinon.stub(jwt, "verify").throws("Nope!");

    const response = executeStack("Bearer 12345", validateToken, testMiddleware);

    expect(request).to.be.undefined;
    
    expect(response.isSent).to.be.true;
    expect(response.status).to.equal(401);
    expect(response.headers["WWW-Authenticate"]).to.equal("Bearer realm=\"Finish line\"");
    expect(response.body.message).to.be.equal("Invalid token.");
  });
});
