const jwt = require("jsonwebtoken");
const config = require("../config");

const { UnauthorizedError } = require("../middleware/restFactory");
const { userRepository } = require("../models/user.model");
const passwords = require("../security/passwords");
const { challengeOptions } = require("../middleware/auth");

async function signinService(req, state) {
  const { email, password } = req.body;

  const user = await userRepository.readByEmail(email);
  if (!user) {
    throw new UnauthorizedError("Invalid username", challengeOptions);
  }
  if (!await passwords.comparePasswords(user.hashedPassword, password)) {
    throw new UnauthorizedError("Invalid password", challengeOptions);
  }
  if (!user.isActive) {
    throw new UnauthorizedError("User account has been deactivated", challengeOptions);
  }

  // Ok, email/password checks out.  Make a token
  const credentials = {
    userId: user._id,
    name: user.name,
    email: user.email,
    isAdmin: user.isAdmin
  };

  const tokenOptions = {};
  if (!config.devMode) {
    tokenOptions.expiresIn = "24h"; // expires in 24 hours
  }

  state.message = `User ${user.email} authenticated.`;
  return jwt.sign(
    credentials,
    config.jwtSecret,
    tokenOptions
  );
}

module.exports = {
  signinService
};



