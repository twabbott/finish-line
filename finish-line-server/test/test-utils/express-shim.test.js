/* eslint-disable no-unused-vars */

const { executeMiddleware, executeMiddlewareAsync } = require("./express-shim");
const { expect } = require("chai");

describe("express-shim", () => {
  const mockReq = {
    headers: {
      host: "my-test.com",
    },
    url: "/foo",
  };

  describe("normal flow", () => {
    it("should do one middleware", () => {
      let called = false;
      
      function middleware(req, res, next) {
        called = true;
        res
          .status(200)
          .json({ test: 1234 });
      }
  
      const response = executeMiddleware(mockReq, middleware);
  
      expect(called).to.be.true;
      expect(response.isSent).to.be.true;
      expect(response.status).to.equal(200);
      expect(response.body.test).to.equal(1234);
    });
  
    it("should do two middlewares", () => {
      let called1 = false;
      let called2 = false;
  
      function middleware1(req, res, next) {
        called1 = true;
        res.set("Location", "http://blarg.com");
        next();
      }
  
      function middleware2(req, res, next) {
        called2 = true;
        res
          .status(200)
          .json({ test: 1234 });
      }
  
      const response = executeMiddleware(mockReq, middleware1, middleware2);
  
      expect(called1).to.be.true;
      expect(called2).to.be.true;
      expect(response.headers["Location"]).to.equal("http://blarg.com");
      expect(response.isSent).to.be.true;
      expect(response.status).to.equal(200);
      expect(response.body.test).to.equal(1234);
    });
  
    it("should do an array of middlewares", () => {
      function middleware1(req, res, next) {
        res.set("Location", "http://blarg.com");
        next();
      }
  
      function middleware2(req, res, next) {
        res
          .status(200)
          .json({ test: 1234 });
      }
  
      const response = executeMiddleware(mockReq, [middleware1, middleware2]);
  
      expect(response.headers["Location"]).to.equal("http://blarg.com");
      expect(response.isSent).to.be.true;
      expect(response.status).to.equal(200);
      expect(response.body.test).to.equal(1234);
    });
  
    it("should do a mix of middleware and arrays", async () => {
      function middleware1(req, res, next) {
        res.set("h1", "1");
        next();
      }
  
      function middleware2(req, res, next) {
        res.set("h2", "2");
        next();
      }
  
      function middleware3(req, res, next) {
        res.set("h3", "3");
        next();
      }
  
      function middlewareEnd(req, res, next) {
        res
          .status(200)
          .json({ test: 1234 });
      }

      // non-async version doesn't work, for some reason
      const response = await executeMiddlewareAsync(
        mockReq,
        middleware1, 
        [middleware2, middleware3],
        middlewareEnd
      );
  
      expect(response.headers["h1"]).to.equal("1");
      expect(response.headers["h2"]).to.equal("2");
      expect(response.headers["h3"]).to.equal("3");
      expect(response.isSent).to.be.true;
      expect(response.status).to.equal(200);
      expect(response.body.test).to.equal(1234);
    });
  });

  describe("error handling", () => {
    it("should hand off error by calling next(err)", () => {
      let called = false;
  
      function middlewareBad(req, res, next) {
        next(new Error("This is an error"));
      }
  
      function middlewareHandle(err, req, res, next) {
        called = true;
        next();
      }

      const response = executeMiddleware(
        mockReq,
        middlewareBad, 
        middlewareHandle
      );

      expect(called).to.be.true;
    });

    it("should hand off error by throwing an exception", () => {
      let called = false;
  
      function middlewareBad(req, res, next) {
        throw new Error("This is an error");
      }
  
      function middlewareHandle(err, req, res, next) {
        called = true;
        next();
      }

      const response = executeMiddleware(
        mockReq,
        middlewareBad, 
        middlewareHandle
      );

      expect(called).to.be.true;
    });

    it("should skip over middleware until it finds an error handler", () => {
      let called1 = false;
      let called2 = false;

      function middlewareBad(req, res, next) {
        throw new Error("This is an error");
      }

      function middlewareSkipped(req, res, next) {
        called1 = true;
      }

      function middlewareHandle(err, req, res, next) {
        called2 = true;
        next();
      }

      const response = executeMiddleware(
        mockReq,
        middlewareBad, 
        middlewareSkipped,
        middlewareHandle
      );

      expect(called1).to.be.false;
      expect(called2).to.be.true;
    });

    it("should find an error handler in an array", () => {
      let called1 = false;
      let called2 = false;

      function middlewareBad(req, res, next) {
        throw new Error("This is an error");
      }

      function middlewareSkipped(req, res, next) {
        called1 = true;
      }

      function middlewareHandle(err, req, res, next) {
        called2 = true;
        next();
      }

      const response = executeMiddleware(
        mockReq,
        middlewareBad, 
        [middlewareSkipped, middlewareHandle]
      );

      expect(called1).to.be.false;
      expect(called2).to.be.true;
    });

    it("should skip over an array of non error-handlers", async () => {
      let called1 = false;
      let called2 = false;
      let called3 = false;

      function middlewareBad(req, res, next) {
        throw new Error("This is an error");
      }

      function middlewareSkip1(req, res, next) {
        called1 = true;
      }

      function middlewareSkip2(req, res, next) {
        called2 = true;
      }

      function middlewareHandle(err, req, res, next) {
        called3 = true;
        next();
      }

      // Non-async version doesn't work, for some reason.
      const response = await executeMiddlewareAsync(
        mockReq,
        middlewareBad, 
        [middlewareSkip1, middlewareSkip2],
        middlewareHandle
      );

      expect(called1).to.be.false;
      expect(called2).to.be.false;
      expect(called3).to.be.true;
    });

    it("should resume calling normal middleawares after handling an error", () => {
      let called1 = false;
      let called2 = false;
      let called3 = false;

      function middlewareBad(req, res, next) {
        throw new Error("This is an error");
      }

      function middlewareSkipped(req, res, next) {
        // should be skipped
        called1 = true;
      }

      function middlewareHandle(err, req, res, next) {
        called2 = true;
        next();
      }

      function middlewareResume(req, res, next) {
        called3 = true;
      }

      const response = executeMiddleware(
        mockReq,
        middlewareBad, 
        middlewareSkipped, 
        middlewareHandle,
        middlewareResume
      );

      expect(called1).to.be.false;
      expect(called2).to.be.true;
      expect(called3).to.be.true;
    });
  });
});






