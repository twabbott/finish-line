

const responses = require("./responses");
const users = require("../models/user.model");
const passwords = require("../security/passwords");

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

    return responses.ok(res, user);
  } catch(err) {
    return responses.internalServerError(res, err);
  }
};
