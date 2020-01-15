const { serviceWrapper, getResponse, postResponse, putResponse, deleteResponse } = require("../middleware/restFactory");
const { createMap } = require("../middleware/automapper");
const regex = require("../shared/regex");
const { handleMongoErrors, validateRequestBody } = require("../middleware/errorHandlers");

const { postUser, readAllUsers, readOneUser, updateUser, deleteUser, errorMessages } = require("../services/users.service");

const userInfoSchema = {
  name: { 
    type: String, 
    required: true 
  },
  email: {
    type: String,
    match: regex.email,
    required: true,
    maxLength: 50
  },
  password: {
    type: String,
    default: null,
    maxLength: 50
  },
  newPassword: {
    type: String,
    default: null,
    maxLength: 50
  },
  isAdmin: {
    type: Boolean,
    default: false
  },
  isActive: {
    type: Boolean,
    required: true
  }
};

const validateUserInfo = validateRequestBody(userInfoSchema);

const mapAll = createMap([
  ["_id", "id"],
  "name",
  "email",
  "isAdmin",
  "isActive",
  "createdAt",
  "updatedAt"
]);

module.exports = {
  getAllUsers: [
    serviceWrapper.callAsync(readAllUsers),
    handleMongoErrors(errorMessages.read),
    mapAll.mapArray,
    getResponse
  ],
  getOneUser: [
    serviceWrapper.callAsync(readOneUser),
    handleMongoErrors(errorMessages.read),
    mapAll.mapScalar,
    getResponse
  ],
  postUser: [
    validateUserInfo,
    serviceWrapper.callAsync(postUser),
    handleMongoErrors(errorMessages.create),
    mapAll.mapScalar,
    postResponse
  ],
  putUser: [
    validateUserInfo,
    serviceWrapper.callAsync(updateUser),
    handleMongoErrors(errorMessages.update),
    mapAll.mapScalar,
    putResponse
  ],
  deleteUser: [
    serviceWrapper.callAsync(deleteUser),
    handleMongoErrors(errorMessages.delete),
    deleteResponse
  ]
};
