const jwt = require("jsonwebtoken");
const config = require("../config");

const challengeOptions = {
  scheme: "Bearer",
  realm: "Finish line"
};

function validateToken(req, res, next) {
  // get the token from the header if present
  let token = req.headers["authorization"];

  // if no token found, return response (without going to the next middelware)
  if (!token) {
    res.unauthorized(challengeOptions, "User not authenticated.");
    return;
  }

  // Remove "Bearer" from string
  if (!token.startsWith("Bearer ")) {
    res.unauthorized(challengeOptions, "Bearer token expected.");
    return;
  }

  try {
    // if can verify the token, set req.user and pass to next middleware
    token = token.slice(7, token.length);
    const decoded = jwt.verify(token, config.jwtSecret);
    req.user = decoded;
    next();
  } catch (ex) {
    // if invalid token
    res.unauthorized(challengeOptions, "Invalid token.");
  }
}

module.exports = {
  validateToken
};



