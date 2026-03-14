function createReq({ method = "GET", headers = {}, body = {}, query = {} } = {}) {
  return {
    method,
    headers,
    body,
    query,
    socket: {
      remoteAddress: "127.0.0.1"
    }
  };
}

function createRes() {
  const res = {
    statusCode: 200,
    headers: {},
    body: null,
    ended: false,
    redirectedTo: "",
    status(code) {
      this.statusCode = code;
      return this;
    },
    json(payload) {
      this.body = payload;
      this.ended = true;
      return this;
    },
    setHeader(name, value) {
      this.headers[name] = value;
      return this;
    },
    writeHead(code, headers) {
      this.statusCode = code;
      this.headers = { ...this.headers, ...headers };
      if (headers && headers.Location) {
        this.redirectedTo = headers.Location;
      }
      return this;
    },
    end() {
      this.ended = true;
      return this;
    }
  };

  return res;
}

module.exports = {
  createReq,
  createRes
};
