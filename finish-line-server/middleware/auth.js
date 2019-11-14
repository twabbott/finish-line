const jwt = require("jsonwebtoken");
const config = require("../config");
const responses = require("../controllers/responses");

function validateToken(req, res, next) {
  // get the token from the header if present
  let token = req.headers["x-access-token"] || req.headers["authorization"];

  // if no token found, return response (without going to the next middelware)
  if (!token) {
    return responses.unauthorized(res, "User not authenticated.");
  }

  // Remove "Bearer" from string
  if (!token.startsWith('Bearer ')) {
    return responses.unauthorized(res, "Bearer token expected.");
  }
  token = token.slice(7, token.length);

  try {
    // if can verify the token, set req.user and pass to next middleware
    const decoded = jwt.verify(token, config.jwtSecret);
    req.user = decoded;
    next();
  } catch (ex) {
    // if invalid token
    return responses.unauthorized(res, "Invalid token.");
  }
};

module.exports = {
  validateToken
};