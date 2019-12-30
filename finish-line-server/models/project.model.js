const mongoose = require("mongoose");

const ObjectId = mongoose.Types.ObjectId;

const PROJECTS = "projects";

const projectStatus = [
  "Active", 
  "Blocked", 
  "On Hold", 
  "Completed"
];

const ProjectSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    links: [{
      url: { type: String, required: true} ,
      text: { type: String, required: true },
      groupName: { type: String }
    }],
    order: { type: Number, required: true },
    status: { type: String, required: true, enum: [...projectStatus] },
    dueDate: { type: Date },
    todo: [{
      todoId: { type: ObjectId, required: true },
      title: { type: String, required: true },
      status: { type: String, required: true, enum: [...projectStatus] },
      details: { type: String, required: true },
      dueDate: { type: Date }
    }],
    userId: { type: ObjectId, indexed: true, required: true },
    isActive: { type: Boolean, default: false },
    createdBy: { type: ObjectId, required: true },
    // createdAt: generated by Mongo
    updatedBy: { type: ObjectId, required: true }
    // updatedAt: generated by Mongo
  },
  { timestamps: true }
);

const projectSchema = mongoose.model(PROJECTS, ProjectSchema);

module.exports = {
  projectSchema
};