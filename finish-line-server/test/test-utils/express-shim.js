

function nextSpy() {
  let nextCalled = false;
  function mockNext() {
    nextCalled = true;
  }

  mockNext.reset = () => nextCalled = false;
  mockNext.wasCalled = () => nextCalled;

  return mockNext;
}

function mockState(testReq, testRes) {
  const baseReq = {
    protocol: "http",
    headers: {
      host: "blah.com",
    },
    url: "/"
  };

  const baseRes = {
    finalResponse: {
      status: undefined,
      message: undefined,
      body: undefined,
      headers: {},
      isSent: false,
      err: null
    },

    locals: {},

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

  return [
    {...baseReq, ...testReq},
    {...baseRes, ...testRes},
    nextSpy()
  ];
}

function arrayCrawl(state, midList, depth) {
  if (depth > 5) {
    throw new Error("executeMiddleware stack overflow detected.");
  }

  for (let m of midList) {
    if (Array.isArray(m)) {
      arrayCrawl(state, m, depth + 1);
    } else if (typeof m === "function") {
      // eslint-disable-next-line no-unused-vars
      const [req, res, next] = state;
      if (res.finalResponse.isSent) {
        continue;
      } 
      
      if (res.finalResponse.err) {
        if (m.length === 4) {
          m(res.finalResponse.err, ...state);
          res.finalResponse.err = null;
        }

        continue;
      } 

      next.reset();
      try {
        m(...state);
      } catch (err) {
        res.finalResponse.err = err;
      }

      if (!next.wasCalled()) {
        if (res.finalResponse.isSent || res.finalResponse.err) {
          continue;
        }

        throw new Error("Middleware did not send a response, throw an error, or call next");
      }
    }
  }
}

function executeMiddleware(state, ...middleware) {
  arrayCrawl(state, middleware, 1);
}

module.exports = {
  mockState,
  executeMiddleware
};