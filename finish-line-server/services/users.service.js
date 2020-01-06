const mongodb = require("mongodb");
const { userSchema } = require("../models/user.model");
const passwords = require("../security/passwords");
const { AppError } = require("../middleware/restFactory");


async function create(props, locals) {
  const { name, email, password, isAdmin, isActive } = props.data;

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

async function readAll() {
  return await userSchema.find();
}

async function readOne(props) {
  const { id } = props.params;
  if (!mongodb.ObjectID.isValid(id)) {
    return null;
  }

  return await userSchema.findById(id);
}

async function update(props) {
  const item = await readOne(props);
  if (!item) {
    return null;
  }

  const { name, email, password, newPassword, isAdmin, isActive } = props.data;
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
  return item;
}

async function deleteOne(props, state) {
  const { id } = props.params;

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
  create,
  readOne,
  readAll,
  update,
  deleteOne
};