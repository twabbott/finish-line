//const mongodb = require("mongodb");
const { userSchema } = require("../models/user.model");
const passwords = require("../security/passwords");
const { BadRequestError, ForbiddenError, NotFoundError } = require("../middleware/restFactory");

const folderService = require("./folder.service");

const errorMessages = {
  create: "Error creating new user.",
  read: "Error reading user(s).",
  update: "Error updating user.",
  delete: "Error deleting user"
};

async function createUser(req, locals) {
  const { name, email, password, isAdmin, isActive } = req.body;

  let newItem = new userSchema({
    name,
    email,
    hashedPassword: await passwords.createEncryptedPassword(password),
    isAdmin,
    isActive
  });
  
  await newItem.save();

  locals.locationId = newItem._id;

  return newItem;
}

async function readAllUsers(req) {
  if (!req.user.isAdmin) {
    return [await internal.findUser(req.user.userId)];
  }

  return await userSchema.find();
}

async function readOneUser(req) {
  const userId = req.params.id;

  if (!req.user.isAdmin && req.user.userId !== req.params.id) {
    throw new ForbiddenError();
  }

  return internal.findUser(userId);
}

async function updateUser(req) {
  if (!req.user.isAdmin && req.user.userId !== req.params.id) {
    throw new ForbiddenError();
  }

  console.log("Update user = begin");
  const item = await internal.findUser(req.params.id);
  if (!item) {
    console.log("Update user = not found");
    return null;
  }

  const { name, email, password, newPassword, isAdmin, isActive } = req.body;
  item.name = name;
  item.email = email;
  if (newPassword) {
    if (!await passwords.comparePasswords(item.hashedPassword, password)) {
      throw new BadRequestError("Property \"password\" does not match current password.");
    }

    item.hashedPassword = await passwords.createEncryptedPassword(newPassword);
  }
  item.isAdmin = isAdmin;
  item.isActive = isActive;

  await item.save();
  console.log("Update user = done");
  return item;
}

async function deleteUser(req, state) {
  if (!req.user.isAdmin) {
    if (req.user.userId !== req.params.id) {
      throw new ForbiddenError();
    }

    throw new BadRequestError(errorMessages.delete, "You cannot delete yourself.  Use another user that has admin rights.");
  }

  const { userId } = req.params;
  const user = await internal.findUser(userId);
  if (!user) {
    throw new NotFoundError();
  }

  if (user.isActive) {
    throw new BadRequestError(errorMessages.delete, "Cannot delete a user that is marked as active.");
  }

  // Delete all documents related to this user
  folderService.utilities.deleteAll(userId);

  const result = await userSchema.deleteOne({ _id: userId });
  const count = (result && result.deletedCount) || 0;

  if (!count) {
    state.message = `User _id=${userId} not found.`;
  }

  return count;
}

const internal = {
  findUser: async (userId) => {
    // if (!mongodb.ObjectID.isValid(userId)) {
    //   return null;
    // }
    console.log(`Looking for userId=${userId}`);
    return await userSchema.findById(userId);
  }
};

module.exports = {
  createUser,
  readOneUser,
  readAllUsers,
  updateUser,
  deleteUser,
  errorMessages
};