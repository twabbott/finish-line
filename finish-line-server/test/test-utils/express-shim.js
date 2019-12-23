function mockState(testReq, testRes, testNext) {
  const baseReq = {
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

module.exports = {
  mockState
};