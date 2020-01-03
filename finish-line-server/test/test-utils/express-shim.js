function mockState(testReq, testRes, testNext) {
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

  const baseNext = () => {};

  return [
    {...baseReq, ...testReq},
    {...baseRes, ...testRes},
    testNext || baseNext
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
      m(...state);
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