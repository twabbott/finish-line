const { userRepository } = require("../models/user.model");

const passwords = require("../security/passwords");
const { BadRequestError, ForbiddenError, NotFoundError } = require("../middleware/restFactory");

const folderService = require("./folder.service");

const errorMessages = {
  create: "Error creating new user.",
  read: "Error reading user(s).",
  update: "Error updating user.",
  delete: "Error deleting user"
};

async function createUser(req, ctrl) {
  const { name, email, password, isAdmin, isActive } = req.body;

  // Don't let the user create an admin user unless they're signed in AS an
  // admin user.
  if (isAdmin && (!req.user || !req.user.isAdmin)) {
    throw new BadRequestError(errorMessages.create, "Cannot create another admin user, unless you're currently signed in as an admin user.");
  }

  let user = await userRepository.createUser({
    name,
    email,
    hashedPassword: await passwords.createEncryptedPassword(password),
    isAdmin,
    isActive
  });

  ctrl.setLocationId(user._id);

  return user;
}

async function readAllUsers(req) {
  if (!req.user || !req.user.userId) {
    throw new ForbiddenError();
  }

  if (!req.user.isAdmin) {
    const item = await userRepository.readOneUser(req.user.userId);
    if (!item) {
      throw new NotFoundError(`User not found; userId=${req.user.userId}`);
    }
    return [item];
  }

  return await userRepository.readAllUsers();
}

async function readOneUser(req) {
  const userId = req.params.id;

  if (!req.user || !req.user.userId || (!req.user.isAdmin && req.user.userId !== req.params.id)) {
    throw new ForbiddenError();
  }

  return await userRepository.readOneUser(userId);
}

async function updateUser(req) {
  if (!req.user.isAdmin && req.user.userId !== req.params.id) {
    throw new ForbiddenError();
  }

  const item = await userRepository.readOneUser(req.params.id);
  if (!item) {
    throw new NotFoundError(`User not found; userId=${req.params.id}`);
  }

  const { name, email, password, newPassword, isAdmin, isActive } = req.body;
  item.name = name;
  item.email = email;
  if (!await passwords.comparePasswords(item.hashedPassword, password) && !req.user.isAdmin) {
    throw new BadRequestError(errorMessages.update, "Property \"password\" must match current password.");
  }
  
  if (newPassword) {
    item.hashedPassword = await passwords.createEncryptedPassword(newPassword);
  }

  if (isAdmin && !req.user.isAdmin) {
    throw new BadRequestError(errorMessages.update, "You must be an admin in order to grant admin priveliges to any user.");
  }

  item.isAdmin = isAdmin;
  item.isActive = isActive;

  await item.save();
  return item;
}

async function deleteUser(req) {
  if (!req.user.isAdmin) {
    if (req.user.userId !== req.params.id) {
      throw new ForbiddenError();
    }

    throw new BadRequestError(errorMessages.delete, "You cannot delete yourself.  Use another user that has admin rights.");
  }

  const results = [];
  const userId = req.params.id;
  const user = await userRepository.readOneUser(userId);
  if (user && user.isActive) {
    throw new BadRequestError(errorMessages.delete, "Cannot delete a user that is marked as active.");
  }

  // Delete all documents related to this user
  let count, totalCount = 0;
  count = await folderService.userRepository.deleteAll(userId);
  results.push[`folders: deleted ${count} items.`];
  totalCount += count;

  count = await userRepository.deleteUser(userId);
  results.push[`users: deleted ${count} items.`];
  totalCount += count;

  if (totalCount === 0) {
    console.log("Delete did nothing");
    console.log(results);
    throw new NotFoundError("No records found for userId " + userId);
  }

  return {
    results,
    totalCount
  };
}

module.exports = {
  createUser,
  readOneUser,
  readAllUsers,
  updateUser,
  deleteUser,
  errorMessages,
};