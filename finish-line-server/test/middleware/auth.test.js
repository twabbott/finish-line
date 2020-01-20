// Test framework libraries
const { expect } = require("chai");
const sinon = require("sinon");

// Local dependencies
const { executeMiddleware } = require("../test-utils/express-shim");

// Mocked modules
const jwt = require("jsonwebtoken");

// Module under test
const { validateToken } = require("../../middleware/auth");

describe("auth", () => {
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
  
    return executeMiddleware(mockReq, ...middleware);
  }

  it("should authorize with a valid token", () => {
    const result = executeStack("Bearer 12345", validateToken);

    expect(result.isSent).to.be.false;
    expect(result.req.user).to.be.ok;
    expect(result.req.user.username).to.equal(testEmail);
  });

  it("should respond with 401 if token is missing", () => {
    const result = executeStack(undefined, validateToken);
    
    expect(result.isSent).to.be.true;
    expect(result.status).to.equal(401);
    expect(result.headers["WWW-Authenticate"]).to.equal("Bearer realm=\"Finish line\"");
    expect(result.body.message).to.be.equal("User not authenticated.");
  });

  it("should respond with 401 if token type is not \"Bearer\"", () => {
    const result = executeStack("xxx 12345", validateToken);

    expect(result.isSent).to.be.true;
    expect(result.status).to.equal(401);
    expect(result.headers["WWW-Authenticate"]).to.equal("Bearer realm=\"Finish line\"");
    expect(result.body.message).to.be.equal("Bearer token expected.");
  });

  it("should respond with 401 if token is invalid", () => {
    jwt.verify.restore(); // Get rid of old stub.
    sinon.stub(jwt, "verify").throws("Nope!");

    const result = executeStack("Bearer 12345", validateToken);

    expect(result.isSent).to.be.true;
    expect(result.status).to.equal(401);
    expect(result.headers["WWW-Authenticate"]).to.equal("Bearer realm=\"Finish line\"");
    expect(result.body.message).to.be.equal("Invalid token.");
  });
});
