const responses = require("./responses");
const crud = require("./crud");
const folderSchema = require("../models/folder.model");

function transform(schemaItem, body, isCreate) {
  schemaItem.name = body.name;
}

module.exports = crud(folderSchema, "Folder", transform);

module.exports.createRootItem = async function(req, res) {
  const body = req.body;
  if (typeof body !== "object") {
    return responses.badRequest(res, "Error parsing request body.");
  }

  const newItem = new schema();
  newItem.name = body.name;
  newItem.userId = body.userId; // TODO: get this from the user's credentials, not from the request.  ;-)
  newItem.parentId = null;
  newItem.childrenIds = [];
  newItem.projectIds = [];

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
