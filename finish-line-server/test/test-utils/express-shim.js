

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
    Object.assign(baseReq, testReq),
    Object.assign(baseRes, testRes),
  ];
}

function arrayCrawl(onComplete, state, ...array) {
  const [req, res] = state;
  state.depth = 0;

  invoke(...array);

  function invoke(nextMiddleware, ...rest) {
    function next(err) {
      res.finalResponse.err = err;
  
      if (!res.finalResponse.isSent) {
        // console.log("arrayCrawl - next - calling next middleware")
        invoke(...rest);
      }
    };
  
    state.depth++;
    // console.log("arrayCrawl - begin")
    if (nextMiddleware) {
      if (Array.isArray(nextMiddleware)) {
        // console.log("arrayCrawl - invoking an array")
        invoke(...nextMiddleware);
    
        next(res.finalResponse.err);
        // console.log("arrayCrawl - done invoking an array")
      } else {
        try {
          if (res.finalResponse.err) {
            // console.log("arrayCrawl - searching for error middleware")
            if (nextMiddleware.length === 4) {
              // console.log("arrayCrawl - calling error middleware")
              nextMiddleware(res.finalResponse.err, req, res, next);
            } else {
              // console.log("arrayCrawl - skipping non-error middleware")
              next(res.finalResponse.err);
            }
          } else {
            if (nextMiddleware.length === 3) {
              // console.log("arrayCrawl - calling middleware")
              nextMiddleware(req, res, next);
            } else {
              // console.log("arrayCrawl - skipping non-error middleware")
              next();
            }
          }
        } catch (err) {
          // console.log("arrayCrawl - caught an exception")
          // console.trace(err)
          next(err);
        }
      }
    }

    state.depth--;
    if (state.depth === 0 && onComplete) {
      onComplete(state);
    }

    // console.log("arrayCrawl - end, depth=" + state.depth);
  }
}

function executeMiddlewareAsync(initialReq, ...middleware) {
  const state = mockState(initialReq);
  const [req, res] = state;

  return new Promise((resolve, reject) => {
    arrayCrawl(resolve, state, ...middleware);
  });
}


function executeMiddleware(initialReq, ...middleware) {
  const state = mockState(initialReq);
  arrayCrawl(undefined, state, ...middleware);

  return state[1].finalResponse;
}

module.exports = {
  executeMiddleware
};