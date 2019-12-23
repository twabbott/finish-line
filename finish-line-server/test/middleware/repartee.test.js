const { expect } = require("chai");

const repartee = require("../../middleware/repartee");

describe("repartee", () => {
  const testMessage = "This is the message.";
  const testData = { a: "some string", b: 6, c: true };

  function buildFixture(mockReq, mockRes) {
    const middleware = repartee.responses();

    const req = {
      headers: {
        host: "blah.com",
      },
      url: "/",
      ...mockReq,
    };

    const res = {
      ...mockRes,
      finalResponse: {
        status: undefined,
        message: undefined,
        body: undefined,
        headers: {},
        isSent: false
      },

      status(status) {
        this.finalResponse.status = status;
        return this;
      },

      json(body) {
        this.finalResponse.body = body;
        this.finalResponse.isSent = true;
        return this;
      },

      set(header, value) {
        this.finalResponse.headers[header] = value;
        return this;
      },

      sendStatus(status) {
        this.finalResponse.status = status;
        this.finalResponse.isSent = true;
      }
    };

    const next = () => {};

    middleware(req, res, next);

    return res;
  }

  beforeEach(() => {

  });

  //////////////////////////////////////////////////////////////////////////////
  describe("200 ok()", () => {
    it("should return default 200 response", () => {
      const mockRes = buildFixture();
  
      mockRes.ok();
  
      expect(mockRes.finalResponse.status).to.equal(200);
      expect(mockRes.finalResponse.body).to.not.be.undefined;
      expect(mockRes.finalResponse.body.success).to.be.true;
      expect(mockRes.finalResponse.body.message).to.be.equal(repartee.defaultMessages.ok);
      expect(mockRes.finalResponse.body.data).to.be.undefined;
    });
  
    it("should return 200 response with message", () => {
      const mockRes = buildFixture();
  
      mockRes.ok(undefined, testMessage);
  
      expect(mockRes.finalResponse.status).to.equal(200);
      expect(mockRes.finalResponse.body).to.not.be.undefined;
      expect(mockRes.finalResponse.body.success).to.be.true;
      expect(mockRes.finalResponse.body.message).to.be.equal(testMessage);
      expect(mockRes.finalResponse.body.data).to.be.undefined;
    });
  
    it("should return 200 response with payload", () => {
      const mockRes = buildFixture();
  
      mockRes.ok({...testData});
  
      expect(mockRes.finalResponse.status).to.equal(200);
      expect(mockRes.finalResponse.body).to.not.be.undefined;
      expect(mockRes.finalResponse.body.success).to.be.true;
      expect(mockRes.finalResponse.body.message).to.be.equal(repartee.defaultMessages.ok);
      expect(mockRes.finalResponse.body.data).to.deep.equal(testData);
    });
  })

  //////////////////////////////////////////////////////////////////////////////
  describe("201 created()", () => {
    it("should return default 201 response", () => {
      const mockReq = {
        headers: {
          host: "my-test.com",
        },
        url: "/foo",
      }
      const mockRes = buildFixture(mockReq);
  
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
      }
      const mockRes = buildFixture(mockReq);
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
      const mockRes = buildFixture();

      mockRes.noContent();
  
      expect(mockRes.finalResponse.status).to.equal(204);
      expect(mockRes.finalResponse.body).to.be.undefined;
    });
  });

  //////////////////////////////////////////////////////////////////////////////
  describe("400 badRequest()", () => {
    it("should return default 400 response", () => {
      const mockRes = buildFixture();
  
      mockRes.badRequest();
  
      expect(mockRes.finalResponse.status).to.equal(400);
      expect(mockRes.finalResponse.body).to.not.be.undefined;
      expect(mockRes.finalResponse.body.success).to.be.false;
      expect(mockRes.finalResponse.body.message).to.be.equal(repartee.defaultMessages.badRequest);
      expect(mockRes.finalResponse.body.data).to.be.undefined;
    });
  
    it("should return 400 response with message", () => {
      const mockRes = buildFixture();
  
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
      const mockRes = buildFixture();
  
      mockRes.unauthorized();
  
      expect(mockRes.finalResponse.status).to.equal(401);
      expect(mockRes.finalResponse.body).to.not.be.undefined;
      expect(mockRes.finalResponse.body.success).to.be.false;
      expect(mockRes.finalResponse.body.message).to.be.equal(repartee.defaultMessages.unauthorized);
      expect(mockRes.finalResponse.body.data).to.be.undefined;
    });
  
    it("should return 401 response with message", () => {
      const mockRes = buildFixture();
  
      mockRes.unauthorized(testMessage);
  
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
      const mockRes = buildFixture();
  
      mockRes.forbidden();
  
      expect(mockRes.finalResponse.status).to.equal(403);
      expect(mockRes.finalResponse.body).to.not.be.undefined;
      expect(mockRes.finalResponse.body.success).to.be.false;
      expect(mockRes.finalResponse.body.message).to.be.equal(repartee.defaultMessages.forbidden);
      expect(mockRes.finalResponse.body.data).to.be.undefined;
    });
  
    it("should return 403 response with message", () => {
      const mockRes = buildFixture();
  
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
      const mockRes = buildFixture();
  
      mockRes.notFound();
  
      expect(mockRes.finalResponse.status).to.equal(404);
      expect(mockRes.finalResponse.body).to.not.be.undefined;
      expect(mockRes.finalResponse.body.success).to.be.false;
      expect(mockRes.finalResponse.body.message).to.be.equal(repartee.defaultMessages.notFound);
      expect(mockRes.finalResponse.body.data).to.be.undefined;
    });
  
    it("should return 404 response with message", () => {
      const mockRes = buildFixture();
  
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
      const mockRes = buildFixture();
  
      mockRes.methodNotAllowed();
  
      expect(mockRes.finalResponse.status).to.equal(405);
      expect(mockRes.finalResponse.body).to.not.be.undefined;
      expect(mockRes.finalResponse.body.success).to.be.false;
      expect(mockRes.finalResponse.body.message).to.be.equal(repartee.defaultMessages.methodNotAllowed);
      expect(mockRes.finalResponse.body.data).to.be.undefined;
    });
  
    it("should return 405 response with message", () => {
      const mockRes = buildFixture();
  
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
      const mockRes = buildFixture();
  
      mockRes.conflict();
  
      expect(mockRes.finalResponse.status).to.equal(409);
      expect(mockRes.finalResponse.body).to.not.be.undefined;
      expect(mockRes.finalResponse.body.success).to.be.false;
      expect(mockRes.finalResponse.body.message).to.be.equal(repartee.defaultMessages.conflict);
      expect(mockRes.finalResponse.body.data).to.be.undefined;
    });
  
    it("should return 409 response with message", () => {
      const mockRes = buildFixture();
  
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
      const mockRes = buildFixture();
  
      mockRes.internalServerError();
  
      expect(mockRes.finalResponse.status).to.equal(500);
      expect(mockRes.finalResponse.body).to.not.be.undefined;
      expect(mockRes.finalResponse.body.success).to.be.false;
      expect(mockRes.finalResponse.body.message).to.be.equal(repartee.defaultMessages.internalServerError);
      expect(mockRes.finalResponse.body.data).to.be.undefined;
    });
  
    it("should return 500 response with message", () => {
      const mockRes = buildFixture();
  
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
      const mockRes = buildFixture();
  
      mockRes.errorResponse(999, testMessage);
  
      expect(mockRes.finalResponse.status).to.equal(999);
      expect(mockRes.finalResponse.body).to.not.be.undefined;
      expect(mockRes.finalResponse.body.success).to.be.false;
      expect(mockRes.finalResponse.body.message).to.be.equal(testMessage);
      expect(mockRes.finalResponse.body.data).to.be.undefined;
    });
  });
});
