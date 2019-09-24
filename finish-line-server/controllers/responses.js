function errorMessage(message) {
  return {
    error: message
  };
}

module.exports.ok = function(res, data) {
  return res 
    .status(200) 
    .json(data);
};

module.exports.created = function(req, res, data) {
  var uri = `http://${req.headers["host"]}${req.url}/${data._id}`;
  res.set("Location", uri);

  return res
    .status(201)
    .json(data);
};

module.exports.noContent = function(res) {
  return res 
    .sendStatus(204);
};

module.exports.notFound = function(res, message) {
  return res
    .status(404)
    .json(errorMessage(message));
};

module.exports.badRequest = function(res, message) {
  return res
    .status(400)
    .json(errorMessage(message));
};

module.exports.internalServerError = function(res, err) {
  console.log(err);
  return res
    .status(500)
    .json(errorMessage("Internal server error"));
};
