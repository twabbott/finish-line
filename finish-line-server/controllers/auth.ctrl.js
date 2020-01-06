const jwt = require("jsonwebtoken");

const vet = require("../middleware/vet");
const users = require("../models/user.model");
const passwords = require("../security/passwords");
const config = require("../config");
const regex = require("../shared/regex");

const validateSignin = [vet({
    email: {
      type: String,
      match: regex.email,
      required: true,
      maxLength: 50
    },
    password: {
      type: String,
      required: true,
      maxLength: 50
    }
  }),
  (req, res, next) => {
    if (res.locals.errors) {
      return res.badRequest("Invalid login info.", res.locals.errors);
    }

    next();
  }
];

async function signin (req, res) {
  const { email, password } = req.data;

  try {
    const [user] = await users.userSchema.find({ email });
    if (!user) {
      return res.unauthorized(res);
    }
    if (!await passwords.comparePasswords(user.hashedPassword, password)) {
      return res.unauthorized(res);
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

    let token = jwt.sign(
      credentials,
      config.jwtSecret,
      tokenOptions
    );

    return res.ok(token, `User ${user.email} authenticated.`);
  } catch(err) {
    console.trace(err);
    return res.internalServerError();
  }
}

module.exports = [
  validateSignin,
  signin
];
