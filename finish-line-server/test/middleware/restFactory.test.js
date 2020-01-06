/* eslint-disable no-unused-vars */
// Test framework libraries
const { expect } = require("chai");
//const sinon = require("sinon");

const { mockState, executeMiddleware } = require("../test-utils/express-shim");
const restFactory = require("../../middleware/restFactory");
const repartee = require("../../middleware/repartee");

describe("restFactory", () => {
  const service = {
    makeSuccessResult: (req, res, next) => {
      res.locals.result = { testProp: "success" };

      next();
    },
    makeCreatedSuccessResult: (locationId) => (req, res, next) => {
      res.locals.result = { testProp: "success" };
      res.locals.locationId = locationId;

      next();
    },
    makeDoNothingResult: (req, res, next) => {
      next();
    },
    makeDeleteSuccessResult: (req, res, next) => {
      res.locals.result = 1;

      next();
    },
    makeDeleteNotFoundResult: (req, res, next) => {
      res.locals.result = 0;

      next();
    },
    makeErrorResult: (req, res, next) => {
      res.locals.errors.push("Blarg!");

      next();
    },
    makeFatalResult: (req, res, next) => {
      throw new Error("Blarg!");
    },
  };

  function buildMountedMiddleware(...middleware) {
    const mockReq = {
      headers: {
        host: "my-test.com",
      },
      url: "/foo",
    };

    const reparteeMiddleware = repartee.responses();

    const state = mockState(mockReq);
    executeMiddleware(state, restFactory.init(), reparteeMiddleware, ...middleware);

    return state;
  }

  describe("restFactory", () => {
    it("init should initialize the res.locals property", () => {
      const res = {
        locals: {}
      };

      restFactory.init()({}, res, () => {});

      expect(res.locals.hasOwnProperty("result")).to.be.true;
      expect(res.locals.result).to.be.null;

      expect(res.locals.hasOwnProperty("errors")).to.be.true;
      expect(Array.isArray(res.locals.errors)).to.be.true;
      expect(res.locals.errors.length).to.equal(0);
    });
  });

  describe("generalResponse", () => {
    it("should respond with 200 OK if service sets res.locals.result", () => {
      const [mockReq, mockRes] = buildMountedMiddleware(
        service.makeSuccessResult,
        restFactory.middleware.generalResponse
      );

      const { status, body } = mockRes.finalResponse;

      expect(status).to.equal(200);
      expect(body).to.not.be.undefined;
      expect(body.data.testProp).to.equal("success");
      expect(body.message).to.be.equal(repartee.defaultMessages.ok);
    });

    it("should respond with 404 Not Found if service sets res.locals.result=null", () => {
      const [mockReq, mockRes] = buildMountedMiddleware(
        service.makeDoNothingResult,
        restFactory.middleware.generalResponse
      );
    
      const { status, body } = mockRes.finalResponse;

      expect(status).to.equal(404);
      expect(body).to.not.be.undefined;
      expect(body.success).to.be.false;
      expect(body.message).to.be.equal(repartee.defaultMessages.notFound);
      expect(body.data).to.be.undefined;
    });
  });

  describe("postResponse", () => {
    it("should respond with 201 Created if service sets res.locals.result", () => {
      const [mockReq, mockRes] = buildMountedMiddleware(
        service.makeCreatedSuccessResult(),
        restFactory.middleware.postResponse
      );
    
      const { status, headers, body } = mockRes.finalResponse;

      expect(status).to.equal(201);
      expect(headers.Location).to.be.undefined;
      expect(body).to.not.be.undefined;
      expect(body.data.testProp).to.equal("success");
    });

    it("should respond with 201 Created and set Location header if service sets res.locals.locationId (use number)", () => {
      const [mockReq, mockRes] = buildMountedMiddleware(
        service.makeCreatedSuccessResult(1234),
        restFactory.middleware.postResponse
      );

      const { status, headers, body } = mockRes.finalResponse;

      expect(status).to.equal(201);
      expect(headers.Location).to.equal("http://my-test.com/foo/1234");
      expect(body).to.not.be.undefined;
      expect(body.data.testProp).to.equal("success");
    });

    it("should respond with 201 Created and set Location header if service sets res.locals.locationId (use string)", () => {
      const [mockReq, mockRes] = buildMountedMiddleware(
        service.makeCreatedSuccessResult("1234"),
        restFactory.middleware.postResponse
      );

      const { status, headers, body } = mockRes.finalResponse;

      expect(status).to.equal(201);
      expect(headers.Location).to.equal("http://my-test.com/foo/1234");
      expect(body).to.not.be.undefined;
      expect(body.data.testProp).to.equal("success");
    });

    it("should respond with 201 Created and NOT set Location header if res.locals.locationId is not a Number or String", () => {
      const [mockReq, mockRes] = buildMountedMiddleware(
        service.makeCreatedSuccessResult(true),
        restFactory.middleware.postResponse
      );
    
      const { status, headers, body } = mockRes.finalResponse;

      expect(status).to.equal(201);
      expect(headers.Location).to.be.undefined;
      expect(body).to.not.be.undefined;
      expect(body.data.testProp).to.equal("success");
    });
  });

  describe("deleteResponse", () => {
    it("should respond with 200 OK if service sets res.locals.result > 0", () => {
      const [mockReq, mockRes] = buildMountedMiddleware(
        service.makeDeleteSuccessResult,
        restFactory.middleware.deleteResponse
      );
    
      const { status, headers, body } = mockRes.finalResponse;

      expect(status).to.equal(200);
      expect(body).to.not.be.undefined;
      expect(body.message).to.contain("Deleted 1 item.");
    });

    it("should respond with 404 if service sets res.locals.result = 0", () => {
      const [mockReq, mockRes] = buildMountedMiddleware(
        service.makeDeleteNotFoundResult,
        restFactory.middleware.deleteResponse
      );
    
      const { status, headers, body } = mockRes.finalResponse;

      expect(status).to.equal(404);
      expect(body).to.not.be.undefined;
      expect(body.success).to.be.false;
      expect(body.message).to.be.equal(repartee.defaultMessages.notFound);
      expect(body.data).to.be.undefined;
    });

    it("should respond with 404 if service leaves res.locals.result unset", () => {
      const [mockReq, mockRes] = buildMountedMiddleware(
        service.makeDoNothingResult,
        restFactory.middleware.deleteResponse
      );
    
      const { status, headers, body } = mockRes.finalResponse;

      expect(status).to.equal(404);
      expect(body).to.not.be.undefined;
      expect(body.success).to.be.false;
      expect(body.message).to.be.equal(repartee.defaultMessages.notFound);
      expect(body.data).to.be.undefined;
    });
  });

  describe("handleClientErrors", () => {
    it("should do nothing if errors array is empty", () => {
      const [mockReq, mockRes] = buildMountedMiddleware(
        service.makeSuccessResult,
        restFactory.middleware.handleClientErrors,
        restFactory.middleware.generalResponse
      );

      const { status, body } = mockRes.finalResponse;

      expect(status).to.equal(200);
      expect(body).to.not.be.undefined;
      expect(body.data.testProp).to.equal("success");
      expect(body.message).to.be.equal(repartee.defaultMessages.ok);
    });

    it("should return 400 if errors array has items", () => {
      const [mockReq, mockRes] = buildMountedMiddleware(
        service.makeErrorResult,
        restFactory.middleware.handleClientErrors,
        restFactory.middleware.generalResponse
      );

      const { status, body } = mockRes.finalResponse;
    
      expect(status).to.equal(400);
      expect(body).to.not.be.undefined;
      expect(body.success).to.be.false;
      expect(body.message).to.be.equal(repartee.defaultMessages.badRequest);
      expect(body.data).to.be.undefined;
    });
  });

  describe("handleFatalError", () => {
    it("should take an error and return a 500", () => {
      const [mockReq, mockRes] = buildMountedMiddleware(
        service.makeFatalResult,
        restFactory.middleware.handleClientErrors,
        restFactory.middleware.generalResponse,
        restFactory.middleware.handleFatalError
      );

      const { status, body } = mockRes.finalResponse;
    
      expect(status).to.equal(500);
      expect(body).to.not.be.undefined;
      expect(body.success).to.be.false;
      expect(body.message).to.be.equal(repartee.defaultMessages.internalServerError);
      expect(body.data).to.be.undefined;
    });
  });

  describe("macros", () => {
    describe("get", () => {
      it("should return 200 on success", () => {
        const [mockReq, mockRes] = buildMountedMiddleware(
          service.makeSuccessResult,
          restFactory.get
        );
  
        const { status, body } = mockRes.finalResponse;
  
        expect(status).to.equal(200);
        expect(body).to.not.be.undefined;
        expect(body.data.testProp).to.equal("success");
        expect(body.message).to.be.equal(repartee.defaultMessages.ok);
      });

      it("should return 400 if there are errors", () => {
        const [mockReq, mockRes] = buildMountedMiddleware(
          service.makeErrorResult,
          restFactory.get
        );
  
        const { status, body } = mockRes.finalResponse;
    
        expect(status).to.equal(400);
        expect(body).to.not.be.undefined;
        expect(body.success).to.be.false;
        expect(body.message).to.be.equal(repartee.defaultMessages.badRequest);
        expect(body.data).to.be.undefined;
      });

      it("should return 500 if there is a fatal error", () => {
        const [mockReq, mockRes] = buildMountedMiddleware(
          service.makeFatalResult,
          restFactory.get
        );
  
        const { status, body } = mockRes.finalResponse;
    
        expect(status).to.equal(500);
        expect(body).to.not.be.undefined;
        expect(body.success).to.be.false;
        expect(body.message).to.be.equal(repartee.defaultMessages.internalServerError);
        expect(body.data).to.be.undefined;
      });
    });

    describe("post", () => {
      it("should return 201 on success", () => {
        const [mockReq, mockRes] = buildMountedMiddleware(
          service.makeCreatedSuccessResult(1234),
          restFactory.post
        );
  
        const { status, headers, body } = mockRes.finalResponse;

        expect(status).to.equal(201);
        expect(headers.Location).to.equal("http://my-test.com/foo/1234");
        expect(body).to.not.be.undefined;
        expect(body.data.testProp).to.equal("success");
      });

      it("should return 400 if there are errors", () => {
        const [mockReq, mockRes] = buildMountedMiddleware(
          service.makeErrorResult,
          restFactory.post
        );
  
        const { status, body } = mockRes.finalResponse;
    
        expect(status).to.equal(400);
        expect(body).to.not.be.undefined;
        expect(body.success).to.be.false;
        expect(body.message).to.be.equal(repartee.defaultMessages.badRequest);
        expect(body.data).to.be.undefined;
      });

      it("should return 500 if there is a fatal error", () => {
        const [mockReq, mockRes] = buildMountedMiddleware(
          service.makeFatalResult,
          restFactory.post
        );
  
        const { status, body } = mockRes.finalResponse;
    
        expect(status).to.equal(500);
        expect(body).to.not.be.undefined;
        expect(body.success).to.be.false;
        expect(body.message).to.be.equal(repartee.defaultMessages.internalServerError);
        expect(body.data).to.be.undefined;
      });
    });

    describe("put", () => {
      it("should return 200 on success", () => {
        const [mockReq, mockRes] = buildMountedMiddleware(
          service.makeCreatedSuccessResult(),
          restFactory.put
        );
  
        const { status, headers, body } = mockRes.finalResponse;

        expect(status).to.equal(200);
        expect(body).to.not.be.undefined;
        expect(body.data.testProp).to.equal("success");
      });

      it("should return 400 if there are errors", () => {
        const [mockReq, mockRes] = buildMountedMiddleware(
          service.makeErrorResult,
          restFactory.put
        );
  
        const { status, body } = mockRes.finalResponse;
    
        expect(status).to.equal(400);
        expect(body).to.not.be.undefined;
        expect(body.success).to.be.false;
        expect(body.message).to.be.equal(repartee.defaultMessages.badRequest);
        expect(body.data).to.be.undefined;
      });

      it("should return 500 if there is a fatal error", () => {
        const [mockReq, mockRes] = buildMountedMiddleware(
          service.makeFatalResult,
          restFactory.put
        );
  
        const { status, body } = mockRes.finalResponse;
    
        expect(status).to.equal(500);
        expect(body).to.not.be.undefined;
        expect(body.success).to.be.false;
        expect(body.message).to.be.equal(repartee.defaultMessages.internalServerError);
        expect(body.data).to.be.undefined;
      });
    });

    describe("delete", () => {
      it("should return 200 on success", () => {
        const [mockReq, mockRes] = buildMountedMiddleware(
          service.makeDeleteSuccessResult,
          restFactory.delete
        );
  
        const { status, headers, body } = mockRes.finalResponse;

        expect(status).to.equal(200);
        expect(body).to.not.be.undefined;
      });

      it("should return 400 if there are errors", () => {
        const [mockReq, mockRes] = buildMountedMiddleware(
          service.makeErrorResult,
          restFactory.delete
        );
  
        const { status, body } = mockRes.finalResponse;
    
        expect(status).to.equal(400);
        expect(body).to.not.be.undefined;
        expect(body.success).to.be.false;
        expect(body.message).to.be.equal(repartee.defaultMessages.badRequest);
        expect(body.data).to.be.undefined;
      });

      it("should return 500 if there is a fatal error", () => {
        const [mockReq, mockRes] = buildMountedMiddleware(
          service.makeFatalResult,
          restFactory.delete
        );
  
        const { status, body } = mockRes.finalResponse;
    
        expect(status).to.equal(500);
        expect(body).to.not.be.undefined;
        expect(body.success).to.be.false;
        expect(body.message).to.be.equal(repartee.defaultMessages.internalServerError);
        expect(body.data).to.be.undefined;
      });
    });
  });
});
