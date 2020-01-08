const vet = require("../middleware/vet");
const { handleMongoErrors, handleValidationErrors } = require("../middleware/errorHandlers");
const { asyncServiceWrapper, postResponse } = require("../middleware/restFactory");
const regex = require("../shared/regex");
const { signinService } = require("../services/auth.service");

const validateSignin = [
  vet({
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
  handleValidationErrors("Invalid login info")
];

module.exports = {
  signin: [
    validateSignin,
    asyncServiceWrapper(signinService),
    handleMongoErrors("Error logging in"),
    postResponse
  ]
};
