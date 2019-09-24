const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const ObjectId = mongoose.Types.ObjectId();

const Folder = new Schema(
  {
    name: { type: String, required: true },
    userId: { type: ObjectId, required: true, default: null },
    parentId: { type: ObjectId, required: true, default: null },
    childrenIds: { type: [ObjectId] },
    projectIds: {type: [ObjectId]}
  },
  { timestamps: true },
);

module.exports = mongoose.model("folders", Folder);
