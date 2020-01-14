

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

function arrayCrawl(state, ...array) {
  const [req, res] = state;
  let lastError = undefined;

  invoke(req, res, ...array);

  function invoke(req, res, middleware, ...rest) {
    // console.log("arrayCrawl - begin")
    const next = (err) => {
      res.finalResponse.err = err;

      if (res.finalResponse.isSent) {
        // console.log("arrayCrawl - next - response is sent")
        return;
      }

      // console.log("arrayCrawl - next - calling next middleware")
      invoke(req, res, ...rest);
    }

    if (!middleware) {
      // console.log("arrayCrawl - quitting");
      return;
    }
  
    if (Array.isArray(middleware)) {
      // console.log("arrayCrawl - invoking an array")
      invoke(req, res, ...middleware);
  
      next();
      // console.log("arrayCrawl - done invoking an array")
    } else {
      try {
        if (res.finalResponse.err) {
          // console.log("arrayCrawl - searching for error middleware")
          if (middleware.length !== 4) {
            // console.log("arrayCrawl - skipping non-error middleware")
            next(res.finalResponse.err);
          } else {
            // console.log("arrayCrawl - calling error middleware")
            middleware(res.finalResponse.err, req, res, next);
          }
        } else {
          // console.log("arrayCrawl - calling middleware")
          middleware(req, res, next);
        }
      } catch (err) {
        // console.log("arrayCrawl - caught an exception")
        // console.trace(err)
        next(err);
      }
    }

    // console.log("arrayCrawl - end");
  }
}

// function xxx_arrayCrawl(state, midList, depth) {
//   if (depth > 5) {
//     throw new Error("executeMiddleware stack overflow detected.");
//   }

//   for (let m of midList) {
//     if (Array.isArray(m)) {
//       arrayCrawl(state, m, depth + 1);
//     } else if (typeof m === "function") {
//       // eslint-disable-next-line no-unused-vars
//       const [req, res, next] = state;
//       if (res.finalResponse.isSent) {
//         continue;
//       } 
      
//       if (res.finalResponse.err) {
//         if (m.length === 4) {
//           m(res.finalResponse.err, ...state);
//           res.finalResponse.err = null;
//         }

//         continue;
//       } 

//       next.reset();
//       try {
//         m(...state);
//       } catch (err) {
//         res.finalResponse.err = err;
//       }

//       if (!next.wasCalled()) {
//         if (res.finalResponse.isSent || res.finalResponse.err) {
//           continue;
//         }

//         throw new Error("Middleware did not send a response, throw an error, or call next");
//       }
//     }
//   }
// }

function executeMiddleware(state, ...middleware) {
  arrayCrawl(state, ...middleware);

  return state[1].finalResponse;
}

module.exports = {
  mockState,
  executeMiddleware
};