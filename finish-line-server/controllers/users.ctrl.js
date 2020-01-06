const vet = require("../middleware/vet");
const restFactory = require("../middleware/restFactory");
const { createMap } = require("../middleware/automapper");
const regex = require("../shared/regex");
const { handleMongoError } = require("../middleware/errorHandlers");

const usersService = require("../services/users.service");

const validateUserInfo = vet({
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
});

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
    restFactory.serviceWrapper(usersService.readAll),
    handleMongoError,
    mapAll.mapArray,
    restFactory.get
  ],
  getOneUser: [
    restFactory.serviceWrapper(usersService.readOne),
    handleMongoError,
    mapAll.mapScalar,
    restFactory.get
  ],
  createUser: [
    validateUserInfo,
    restFactory.serviceWrapper(usersService.create),
    handleMongoError,
    mapAll.mapScalar,
    restFactory.post
  ],
  putUser: [
    validateUserInfo,
    restFactory.serviceWrapper(usersService.update),
    handleMongoError,
    mapAll.mapScalar,
    restFactory.put
  ],
  deleteUser: [
    restFactory.serviceWrapper(usersService.deleteOne),
    handleMongoError,
    restFactory.delete
  ]
};