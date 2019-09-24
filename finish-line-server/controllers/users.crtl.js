const responses = require("./responses");
const User = require("../models/user.model");

module.exports.getUsers = async function(req, res) {
  try {
    const items = await User.find();
    return responses.ok(res, items);
  } catch(err) {
    return responses.internalServerError(res, err);
  }
};

module.exports.getUserById = async function(req, res) {
  try {
    let item = null;
    
    try {
      item = await User.findById(req.params.id);
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

  const newItem = new User({
    name: body.name,
    email: body.email,
    password: body.password,
  });
  
  try {
    try {
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
    item = await User.findById(req.params.id);
  } catch (err) {
    console.log(err);
  }
  if (!item) {
    return responses.notFound(res, `User _id=${req.params.id} not found.`);
  }

  item.name = body.name;
  item.email = body.email;
  item.password = body.password;
    
  try {
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
      const result = await User.deleteOne({ _id: req.params.id });
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
