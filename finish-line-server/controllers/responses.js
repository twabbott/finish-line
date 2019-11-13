function errorMessage(message) {
  return {
    success: false,
    message
  };
}

module.exports.ok = function(res, data, message) {
  return res 
    .status(200) 
    .json({
      success: true,
      data,
      message: message || "OK"
    });
};

module.exports.created = function(req, res, data, message) {
  var uri = `http://${req.headers["host"]}${req.url}/${data._id}`;
  res.set("Location", uri);

  return res
    .status(201)
    .json({
      success: true,
      data,
      message: message || "Created"
    });
};

module.exports.noContent = function(res) {
  return res 
    .sendStatus(204);
};

module.exports.notFound = function(res, message) {
  return res
    .status(404)
    .json(errorMessage(message || "Not found"));
};

module.exports.badRequest = function(res, message) {
  return res
    .status(400)
    .json(errorMessage(message || "Bad request"));
};

module.exports.unauthorized = function(res, message) {
  res.set("WWW-Authenticate", `Bearer`);
  return res
    .status(401)
    .json(errorMessage(message || "Unknown username or invalid password"));
};

module.exports.internalServerError = function(res, err, message) {
  console.log(err);
  return res
    .status(500)
    .json(errorMessage(message || "Internal server error"));
};
