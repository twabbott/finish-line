const mongoose = require("mongoose");

const ObjectId = mongoose.Types.ObjectId;

const folderSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    userId: { type: ObjectId, indexed: true, required: true },
    parentId: { type: ObjectId, required: false, default: null },
    childrenIds: { type: [ObjectId], required: false },
    projectIds: {type: [ObjectId], required: false }
  },
  { timestamps: true },
);

module.exports.folderSchema = mongoose.model("folders", folderSchema);
