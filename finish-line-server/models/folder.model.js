const mongoose = require("mongoose");

const ObjectId = mongoose.Types.ObjectId;

const FOLDERS = "folders";

const FolderSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    userId: { type: ObjectId, indexed: true, required: true },
    parentId: { type: ObjectId, required: false, default: null },
    childrenIds: { type: [ObjectId], required: false },
    projectIds: {type: [ObjectId], required: false },
    isActive: { type: Boolean, default: false },
    createdBy: { type: ObjectId, required: true },
    // createdAt: generated by Mongo
    updatedBy: { type: ObjectId, required: true },
    // updatedAt: generated by Mongo
  },
  { timestamps: true },
);

const folderSchema = mongoose.model(FOLDERS, FolderSchema);

module.exports = {
  folderSchema
};