const jwt = require("jsonwebtoken");

const vet = require("../middleware/vet");
const users = require("../models/user.model");
const passwords = require("../security/passwords");
const config = require("../config");

const validateSignin = vet({
  email: {
    type: String,
    match: /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/,
    required: true,
    maxLength: 50
  },
  password: {
    type: String,
    required: true,
    maxLength: 50
  }
},
{
  autoRespond: true,
  failMsg: "Invalid login info.",
});

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
};

module.exports = [
  validateSignin,
  signin
]
