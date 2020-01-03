// Test framework libraries
const { expect } = require("chai");
//const sinon = require("sinon");

const { mockState, executeMiddleware } = require("../test-utils/express-shim");
const restFactory = require("../../middleware/restFactory");
const repartee = require("../../middleware/repartee");

describe.only("restFactory", () => {
  const service = {
    makeSuccessResult: (req, res, next) => {
      res.result = { testProp: "success" };

      next();
    },
    makeCreatedSuccessResult: (locationId) => (req, res, next) => {
      res.result = { testProp: "success" };
      res.locationId = locationId;

      next();
    },
    makeNotFoundREsult: (req, res, next) => {
      res.result = null;

      next();
    }
  }

  function buildMountedMiddleware(...middleware) {
    const mockReq = {
      headers: {
        host: "my-test.com",
      },
      url: "/foo",
    }

    const reparteeMiddleware = repartee.responses();

    const state = mockState(mockReq);
    executeMiddleware(state, reparteeMiddleware, ...middleware);

    return state;
  }

  describe("generalResponse", () => {
    it("should respond with 200 OK if service sets res.result", () => {
      const [mockReq, mockRes] = buildMountedMiddleware(
        service.makeSuccessResult,
        restFactory.middleware.generalResponse
      );
    
      expect(mockRes.finalResponse.status).to.equal(200);
      expect(mockRes.finalResponse.body).to.not.be.undefined;
      expect(mockRes.finalResponse.body.data.testProp).to.equal("success");
      expect(mockRes.finalResponse.body.message).to.be.equal(repartee.defaultMessages.ok);
    });

    it("should respond with 404 Not Found if service sets res.result=null", () => {
      const [mockReq, mockRes] = buildMountedMiddleware(
        service.makeNotFoundREsult,
        restFactory.middleware.generalResponse
      );
    
      expect(mockRes.finalResponse.status).to.equal(404);
      expect(mockRes.finalResponse.body).to.not.be.undefined;
      expect(mockRes.finalResponse.body.success).to.be.false;
      expect(mockRes.finalResponse.body.message).to.be.equal(repartee.defaultMessages.notFound);
      expect(mockRes.finalResponse.body.data).to.be.undefined;
    });
  });

  describe("postResponse", () => {
    it("should respond with 201 Created if service sets res.result", () => {
      const [mockReq, mockRes] = buildMountedMiddleware(
        service.makeCreatedSuccessResult(),
        restFactory.middleware.postResponse
      );
    
      expect(mockRes.finalResponse.status).to.equal(201);
      expect(mockRes.finalResponse.headers.Location).to.be.undefined;
      expect(mockRes.finalResponse.body).to.not.be.undefined;
      expect(mockRes.finalResponse.body.data.testProp).to.equal("success");
    });

    it("should respond with 201 Created and set Location header if service sets res.locationId (use number)", () => {
      const [mockReq, mockRes] = buildMountedMiddleware(
        service.makeCreatedSuccessResult(1234),
        restFactory.middleware.postResponse
      );

      expect(mockRes.finalResponse.status).to.equal(201);
      expect(mockRes.finalResponse.headers.Location).to.equal("http://my-test.com/foo/1234");
      expect(mockRes.finalResponse.body).to.not.be.undefined;
      expect(mockRes.finalResponse.body.data.testProp).to.equal("success");
    });

    it("should respond with 201 Created and set Location header if service sets res.locationId (use string)", () => {
      const [mockReq, mockRes] = buildMountedMiddleware(
        service.makeCreatedSuccessResult("1234"),
        restFactory.middleware.postResponse
      );

      expect(mockRes.finalResponse.status).to.equal(201);
      expect(mockRes.finalResponse.headers.Location).to.equal("http://my-test.com/foo/1234");
      expect(mockRes.finalResponse.body).to.not.be.undefined;
      expect(mockRes.finalResponse.body.data.testProp).to.equal("success");
    });

    it("should respond with 201 Created and NOT set Location header if res.locationId is not a Number or String", () => {
      const [mockReq, mockRes] = buildMountedMiddleware(
        service.makeCreatedSuccessResult(true),
        restFactory.middleware.postResponse
      );
    
      expect(mockRes.finalResponse.status).to.equal(201);
      expect(mockRes.finalResponse.headers.Location).to.be.undefined;
      expect(mockRes.finalResponse.body).to.not.be.undefined;
      expect(mockRes.finalResponse.body.data.testProp).to.equal("success");
    });
  });
});
