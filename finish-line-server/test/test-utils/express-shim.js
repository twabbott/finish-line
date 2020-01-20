

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

let tag;
let tracing = false;

function trace(enable) {
  tracing = enable;
}

function logTrace(message) {
  if (tracing) {
    console.log(message);
  }
}

function result(state) {
  const info = {
    ...state[1].finalResponse,
    req: { ...state[0] },
    res: { ...state[1] }
  };
  delete info.res.finalResponse;
  return info;
}

function arrayCrawl(onComplete, state, ...array) {
  const [req, res] = state;
  state.depth = 0;

  invoke(...array);

  async function invoke(nextMiddleware, ...rest) {
    async function next(err) {
      res.finalResponse.err = err;
  
      if (!res.finalResponse.isSent) {
        logTrace(`[${tag}] next - calling next middleware`);
        await invoke(...rest);
      }
    }
  
    state.depth++;
    logTrace(`[${tag}] begin, depth=${state.depth}`);
    if (nextMiddleware) {
      if (Array.isArray(nextMiddleware)) {
        logTrace(`[${tag}] invoking an array`);
        await invoke(...nextMiddleware);
    
        await next(res.finalResponse.err);
        logTrace(`[${tag}] done invoking an array`);
      } else {
        try {
          if (res.finalResponse.err) {
            logTrace(`[${tag}] searching for error middleware`);
            if (nextMiddleware.length === 4) {
              logTrace(`[${tag}] calling error middleware`);
              await nextMiddleware(res.finalResponse.err, req, res, next);
            } else {
              logTrace(`[${tag}] skipping non-error middleware`);
              await next(res.finalResponse.err);
            }
          } else {
            if (nextMiddleware.length === 3) {
              logTrace(`[${tag}] calling middleware`);
              await nextMiddleware(req, res, next);
            } else {
              logTrace(`[${tag}] skipping non-error middleware`);
              await next();
            }
          }
        } catch (err) {
          logTrace(`[${tag}] caught an exception`);
          // console.trace(err);
          await next(err);
        }
      }
    }

    logTrace(`[${tag}] end, depth=${state.depth}`);
    state.depth--;
    if (state.depth === 0 && onComplete) {
      onComplete(result(state));
    }
  }
}

function executeMiddlewareAsync(initialReq, ...middleware) {
  tag = Math.trunc(Math.random() * 900 + 100);
  const state = mockState(initialReq);

  return new Promise((resolve) => {
    arrayCrawl(resolve, state, ...middleware);
    logTrace(`[${tag}] all done`);
  });
}

function executeMiddleware(initialReq, ...middleware) {
  tag = Math.trunc(Math.random() * 900 + 100);
  const state = mockState(initialReq);
  arrayCrawl(undefined, state, ...middleware);
  logTrace(`[${tag}] ###### all done`);

  return result(state);
}

module.exports = {
  executeMiddleware,
  executeMiddlewareAsync,
  trace
};