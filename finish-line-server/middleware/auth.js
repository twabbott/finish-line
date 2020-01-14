const jwt = require("jsonwebtoken");
const config = require("../config");

const { UnauthorizedError, challengeOptions, handleErrors } = require("../middleware/restFactory");

const challenge = challengeOptions("Bearer", "Finish line");

function validateToken(req, res, next) {
  // get the token from the header if present
  let token = req.headers["authorization"];

  // if no token found, return response (without going to the next middelware)
  if (!token) {
    throw new UnauthorizedError("User not authenticated.", challenge);
  }

  // Remove "Bearer" from string
  if (!token.startsWith("Bearer ")) {
    throw new UnauthorizedError("Bearer token expected.", challenge);
  }

  try {
    // if can verify the token, set req.user and pass to next middleware
    token = token.slice(7, token.length);
    const decoded = jwt.verify(token, config.jwtSecret);
    req.user = decoded;
  } catch (ex) {
    // if invalid token
    throw new UnauthorizedError("Invalid token.", challenge);
  }

  next();
}

module.exports = {
  challengeOptions: challenge,
  validateToken: [
    validateToken,
    handleErrors
  ]
};
