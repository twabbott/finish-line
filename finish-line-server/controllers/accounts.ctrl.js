const { handleMongoErrors, validateRequestBody } = require("../middleware/errorHandlers");
const { serviceWrapper, postResponse } = require("../middleware/restFactory");
const regex = require("../shared/regex");
const { signinService } = require("../services/accounts.service");

const signinSchema = {
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
};

module.exports = {
  signin: [
    validateRequestBody(signinSchema),
    serviceWrapper.callAsync(signinService),
    handleMongoErrors("Error logging in"),
    postResponse
  ]
};
