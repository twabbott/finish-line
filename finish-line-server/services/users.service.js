const mongodb = require("mongodb");
const { userSchema } = require("../models/user.model");
const passwords = require("../security/passwords");
const { AppError } = require("../middleware/restFactory");


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

async function readAllUsers() {
  return await userSchema.find();
}

async function readOneUser(req) {
  const { id } = req.params;
  if (!mongodb.ObjectID.isValid(id)) {
    return null;
  }

  return await userSchema.findById(id);
}

async function updateUser(req) {
  console.log("Update user = begin");
  const item = await readOneUser(req);
  if (!item) {
    console.log("Update user = not found");
    return null;
  }

  const { name, email, password, newPassword, isAdmin, isActive } = req.data;
  item.name = name;
  item.email = email;
  if (newPassword) {
    if (!await passwords.comparePasswords(item.hashedPassword, password)) {
      throw new AppError("Property \"password\" does not match current password.");
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
  const { id } = req.params;

  if (!mongodb.ObjectID.isValid(id)) {
    return null;
  }

  const result = await userSchema.deleteOne({ _id: id });
  const count = (result && result.deletedCount) || 0;

  if (!count) {
    state.message = `User _id=${id} not found.`;
  }

  return count;
}

module.exports = {
  createUser,
  readOneUser,
  readAllUsers,
  updateUser,
  deleteUser
};