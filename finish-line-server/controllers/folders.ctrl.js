const responses = require("./responses");
const crud = require("./crud");
const folderSchema = require("../models/folder.model");

function transform(schemaItem, body, isCreate) {
  schemaItem.name = body.name;
  schemaItem.userId = body.userId;
  schemaItem.parentId = body.parentId;
  schemaItem.childrenIds = body.childrenIds;
  schemaItem.projectIds = body.projectIds;
}

module.exports = crud(folderSchema, "Folder", transform);
