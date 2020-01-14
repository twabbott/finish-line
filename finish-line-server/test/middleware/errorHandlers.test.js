// Test framework libraries
const { expect } = require("chai");

// Local dependencies
const { mockState, executeMiddleware } = require("../test-utils/express-shim");
const { init, getResponse } = require("../../middleware/restFactory");

// Module under test
const { validateRequestBody } = require("../../middleware/errorHandlers");

describe("errorHandlers", () => {
  describe("validateRequestBody", () => {
    const schema = {
      user: {
        type: String,
        required: true
      },
      password: {
        type: String,
        required: true
      }
    };

    init({ errorLogger: err => console.trace(err) });

    function executeStack(schema, body) {
      const mockReq = {
        body
      };
  
      const state = mockState(mockReq);
      return executeMiddleware(        
        state, 
        validateRequestBody(schema), 
        (req, res, next) => {
          next();
        },
        getResponse
      );
    }

    it("should accept request with a well-formed body", () => {
      const body = {
        user: "someone@somewhere.com",
        password: "Password1"
      };

      const response = executeStack(schema, body);
  
      expect(response.status).to.equal(200);
    });

    it("should reject request with a mal-formed body", () => {
      const body = {
        userName: "someone@somewhere.com",
        password: "Password1"
      };

      const response = executeStack(schema, body);
  
      expect(response.status).to.equal(400);
      expect(response.body.message).to.equal("Validation error");
      expect(response.body.errors).to.deep.equal([
        {
          property: "user",
          message: "is required"
        },{
          property: "userName",
          message: "unknown property"
        }
      ]);
    });

    it("should reject request with body that is not an object", () => {
      const body = "Hello, world!";

      const response = executeStack(schema, body);
  
      expect(response.status).to.equal(400);
      expect(response.body.message).to.equal("Request payload must be a JSON object");
    });
  });
});