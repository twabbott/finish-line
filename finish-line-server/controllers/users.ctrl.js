const vet = require("../middleware/vet");
const { asyncServiceWrapper, getResponse, postResponse, putResponse, deleteResponse } = require("../middleware/restFactory");
const { createMap } = require("../middleware/automapper");
const regex = require("../shared/regex");
const { handleMongoErrors, handleValidationErrors } = require("../middleware/errorHandlers");

const { createUser, readAllUsers, readOneUser, updateUser, deleteUser } = require("../services/users.service");

const validateUserInfo = [
  vet({
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
      required: true,
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
  }),
  handleValidationErrors("Invalid user info")
];

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
    asyncServiceWrapper(readAllUsers),
    handleMongoErrors("Unable to read users."),
    mapAll.mapArray,
    getResponse
  ],
  getOneUser: [
    asyncServiceWrapper(readOneUser),
    handleMongoErrors("Unable to read user."),
    mapAll.mapScalar,
    getResponse
  ],
  createUser: [
    validateUserInfo,
    asyncServiceWrapper(createUser),
    handleMongoErrors("Error creating new user."),
    mapAll.mapScalar,
    postResponse
  ],
  putUser: [
    validateUserInfo,
    asyncServiceWrapper(updateUser),
    handleMongoErrors("Error updating user."),
    mapAll.mapScalar,
    putResponse
  ],
  deleteUser: [
    asyncServiceWrapper(deleteUser),
    handleMongoErrors("Error deleting user"),
    deleteResponse
  ]
};
