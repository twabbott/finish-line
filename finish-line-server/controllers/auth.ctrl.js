const responses = require("./responses");
const users = require("../models/user.model");
const passwords = require("../security/passwords");
const config = require("../config");
const jwt = require('jsonwebtoken');

module.exports.signin = async function(req, res) {
  try {
    const body = req.body;
    if (!body) {
      return responses.badRequest(res, "You must provide a user.");
    }

    if (!body.email) {
      return responses.badRequest(res, "Property \"email\" not specified.");
    }

    if (!body.password) {
      return responses.badRequest(res, "Property \"password\" not specified.");
    }
  
    const [user] = await users.userSchema.find({email: req.body.email});
    if (!user) {
      return responses.unauthorized(res);
    }
    if (!await passwords.comparePasswords(user.hashedPassword, body.password)) {
      return responses.unauthorized(res);
    }

    // Ok, email/password checks out.  Make a token
    const credentials = {
      name: user.name,
      email: user.email,
      isAdmin: user.isAdmin
    }

    let token = jwt.sign(credentials,
      config.jwtSecret,
      { 
        expiresIn: '24h' // expires in 24 hours
      }
    );

    return responses.ok(res, token, `User ${user.email} authenticated.`);
  } catch(err) {
    return responses.internalServerError(res, err);
  }
};
