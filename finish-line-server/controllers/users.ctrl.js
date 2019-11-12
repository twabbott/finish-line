const responses = require("./responses");
const users = require("../models/user.model");
const passwords = require("../security/passwords");

module.exports.getUsers = async function(req, res) {
  try {
    const items = await users.userSchema.find();
    return responses.ok(res, items);
  } catch(err) {
    return responses.internalServerError(res, err);
  }
};

module.exports.getUserById = async function(req, res) {
  try {
    let item = null;
    
    try {
      item = await users.userSchema.findById(req.params.id);
    } catch (err) {
      console.log(err);
    }
    if (!item) {
      return responses.notFound(res, `User _id=${req.params.id} not found.`);
    }

    return responses.ok(res, item);
  } catch (err) {
    return responses.internalServerError(res, err);
  }
};

module.exports.createUser = async function(req, res) {
  const body = req.body;
  if (!body) {
    return responses.badRequest(res, "You must provide a user.");
  }

  try {    
    let newItem;
    try {
      newItem = new users.userSchema({
        name: body.name,
        email: body.email,
        hashedPassword: await passwords.createEncryptedPassword(body.password),
        isAdmin: body.isAdmin
      });
      
      await newItem.save();
    } catch (err) {
      return responses.badRequest(res, err.message);
    }

    return responses.created(req, res, newItem);
  } catch (err) {
    return responses.internalServerError(res, err);
  }
};

module.exports.updateUser = async function(req, res) {
  const body = req.body;

  if (!body) {
    return responses.badRequest(res, "You must provide a user.");
  }
  let item = null;
    
  try {
    item = await users.userSchema.findById(req.params.id);
  } catch (err) {
    console.log(err);
  }
  if (!item) {
    return responses.notFound(res, `User _id=${req.params.id} not found.`);
  }

  try {
    item.name = body.name;
    item.email = body.email;
    if (body.newPassword) {
      if (!await passwords.comparePasswords(item.hashedPassword, body.password)) {
        throw new Error("Property \"password\" does not match current password.");
      }

      item.hashedPassword = await passwords.createEncryptedPassword(body.newPassword);
    }
    item.isAdmin = body.isAdmin;

    await item.save();

    return responses.ok(res, item);
  } catch (err) {
    return responses.badRequest(res, err.message);
  }
};

module.exports.patchUser = async function(req, res) {
  const body = req.body;

  if (!body) {
    return responses.badRequest(res, "You must provide a user.");
  }

  let item = null;
    
  try {
    item = await users.userSchema.findById(req.params.id);
  } catch (err) {
    console.log(err);
  }
  if (!item) {
    return responses.notFound(res, `User _id=${req.params.id} not found.`);
  }

  try {
    item.name = body.hasOwnProperty("name") ? body.name: item.name;
    item.email = body.hasOwnProperty("email") ? body.email: item.email;
    if (body.hasOwnProperty("newPassword") && await passwords.comparePasswords(item.hashedPassword, body.password)) {
      item.hashedPassword = await passwords.createEncryptedPassword(body.newPassword);
    }
    item.isAdmin = body.hasOwnProperty("isAdmin") ? body.isAdmin: item.isAdmin;

    await item.save();

    return responses.ok(res, item);
  } catch (err) {
    return responses.badRequest(res, err.message);
  }
};

module.exports.deleteUser = async function(req, res) {
  try {
    let found = false;
    try {
      const result = await users.userSchema.deleteOne({ _id: req.params.id });
      found = result && result.deletedCount > 0;
    } catch (err) {
      console.log(err);
    }
    if (!found) {
      return responses.notFound(res, `User _id=${req.params.id} not found.`);
    }

    return responses.noContent(res);
  } catch (err) {
    return responses.internalServerError(res, err);
  }
};
