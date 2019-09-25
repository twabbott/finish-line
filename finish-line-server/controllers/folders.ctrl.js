const responses = require("./responses");
const folderSchema = require("../models/folder.model");

module.exports.getFolders = async function(req, res) {
  try {
    console.log("get folders");
    const items = await folderSchema.find();
    console.log("get folders: " + JSON.stringify(items));
    return responses.ok(res, items);
  } catch(err) {
    return responses.internalServerError(res, err);
  }
};

module.exports.getFolderById = async function(req, res) {
  try {
    let item = null;
    
    try {
      item = await folderSchema.findById(req.params.id);
    } catch (err) {
      console.log(err);
    }
    if (!item) {
      return responses.notFound(res, `Folder _id=${req.params.id} not found.`);
    }

    return responses.ok(res, item);
  } catch (err) {
    return responses.internalServerError(res, err);
  }
};

module.exports.createFolder = async function(req, res) {
  console.log("POST folders");
  const body = req.body;
  if (!body) {
    return responses.badRequest(res, "You must provide a user.");
  }
  console.log("POST folders - " + JSON.stringify(req.body));

  const newItem = new folderSchema({
    name: body.name,
    userId: body.userId,
    parentId: body.parentId,
    childrenIds: body.childrenIds,
    projectIds: body.projectIds
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