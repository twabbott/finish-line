const mongoose = require("mongoose");

const { projectSchema } = require("../models");
const { AppError } = require("../shared");

const ObjectId = mongoose.Types.ObjectId;

function assignAll(project, isCreate, name, links, order, status, dueDate, todo, parentIds, userId) {
  project.name = name;

  if (!links || !Array.isArray(links)) {
    throw new AppError("Property links must be an array");
  }
  project.links = links.map(link => ({
    url: link.url,
    text: link.text,
    groupName: link.groupName
  }));
  project.order = order;
  project.status = status;
  project.dueDate = dueDate;
  if (!todo || !Array.isArray(todo)) {
    throw new AppError("Property todo must be an array");
  }
  project.todo = todo.map(todo => {
    const t = {
      title: todo.title,
      status: todo.status,
      details: todo.details,
      dueDate: todo.dueDate
    };

    if (isCreate) {
      t.todoId = new ObjectId();
    }

    return t;
  });
  if (!parentIds || !Array.isArray(parentIds)) {
    throw new AppError("Property parentIds must be an array");
  }
  project.parentIds = parentIds;
  project.updatedBy = userId;
}

async function create(name, links, order, status, dueDate, todo, parentIds, userId) {
  const project = new projectSchema();

  try {
    assignAll(project, true, name, links, order, status, dueDate, todo, parentIds, userId);
    project.userId = userId;
    project.createdBy = userId;
  
    await project.save();
  } catch(err) {
    throw new AppError(`Error creating new project ${name}: ${err.message}`);
  }

  return project;
}

async function readMany(parentId, userId) {
  let list;

  try {
    list = await projectSchema.find({ parentId: [parentId], userId });
  } catch(err) {
    throw new AppError(`Error reading projects for userId ${userId}: ${err.message}`);
  }

  return list;
}

async function readOne(projectId, userId) {
  if (!projectId) {
    return null;
  }

  let project;
  try {
    project = await projectSchema.findOne({ _id: projectId, userId: userId });
  } catch(err) {
    throw new AppError(`Cannot find project with _id=${projectId}: ${err.message}`);
  }

  return project; 
}

async function update(projectId, name, links, order, status, dueDate, todo, parentIds, userId) {
  let project;
  
  try {
    project = await readOne(projectId, userId);
    if (!project) {
      return null;
    }

    assignAll(project, false, name, links, order, status, dueDate, todo, parentIds, userId);
  
    await project.save();
  } catch(err) {
    throw new AppError(`Cannot update project _id=${projectId}: ${err.message}`);
  }
  
  return project;
}

async function $delete(projectId, userId) {
  const project = await readOne(projectId, userId);
  if (!project) {
    return 0;
  }

  // Can't delete an active project.
  if (project.isActive) {
    throw new AppError("Cannot delete a project unless it is marked as inactive");
  }

  project.delete();

  // Delete all
  let result;
  try {
    result = await projectSchema.deleteOne({ _id: projectId, userId: userId });
  } catch(err) {
    throw new AppError(`Error deleting project _id=${projectId} name=${project.name}: ${err.message}`);
  }

  return (result && result.deletedCount) || 0;
}

module.exports = {
  create,
  readMany,
  readOne,
  update,
  delete: $delete
};
