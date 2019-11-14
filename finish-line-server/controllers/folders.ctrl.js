const responses = require("./responses");
const crudFactory = require("./crud");
const { folderSchema } = require("../models/folder.model");
const { ObjectId } = require("mongodb");

function transform(schemaItem, body, isCreate) {
  schemaItem.name = body.name;
}

module.exports = {};

module.exports.createFolder = crudFactory.create(async (params, body, credentials) => {
  const parentId = params.parentId || null;
  if (parentId && !await folderSchema.findOne({ _id: parentId, userId: credentials.userId })) {
    throw Error(`Folder with parentId=${params.parentId} not found.`);
  }

  const item = new folderSchema();

  item.name = body.name;
  item.userId = credentials.userId;
  item.parentId = parentId;
  item.childrenIds = [];
  item.projectIds = [];

  await item.save();

  return item;
});

module.exports.readAllFolders = crudFactory.readAll(async (params, credentials) => {
  return await folderSchema.find({ userId: credentials.userId});
});

module.exports.readFolder = crudFactory.read(async (params, credentials) => {
  return await folderSchema.findOne({ _id: params.id, userId: credentials.userId });
});

module.exports.updateFolder = crudFactory.update(async (params, body, credentials) => {
  const item = await folderSchema.findOne({ _id: params.id, userId: credentials.userId });
  if (!item) {
    return null;
  }

  item.name = body.name;
  item.parentId = body.parentId;
  item.childrenIds = body.childrenIds;
  item.projectIds = body.projectIds;

  await item.save();

  return item;
});

module.exports.deleteFolder = crudFactory.delete(async (params, credentials) => {
  const result = await folderSchema.deleteOne({ _id: params.id, userId: credentials.userId });
  return result && result.deletedCount > 0;
});
