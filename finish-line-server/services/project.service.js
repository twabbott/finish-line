const { ObjectId } = require("mongodb");

const { projectRepository } = require("../models/project.model");
const { RequestError, BadRequestError, NotFoundError } = require("../middleware/restFactory");

const errorMessages = {
  create: "Error creating project",
  read: "Error reading project(s)",
  update: "Error updating project",
  delete: "Error deleting project",
  general: "General error"
};

async function createProject(req, ctrl) {
  const userId = req.user.userId;

  const project = await projectRepository.createProject({
    name: req.body.name, 
    links: req.body.links,
    status: req.body.status,
    dueDate: req.body.dueDate,
    parentFolderIds: req.body.parentFolderIds,
    todo: req.body.todo,
    userId,
    isActive: req.body.isActive,
    createdBy: userId,
    updatedBy: userId
  });

  let count = 0;
  let errors = [];
  for (let id of req.body.parentFolderIds) {
    try {
      await projectRepository.linkToParent(project, id, userId);
      count++;
    } catch (err) {
      console.log(err)
      errors.push(err.message);
    }
  };

  if (count === 0) {
    if (errors.length === 0) {
      errors.push("General failure linking project to parent folder.");
    }

    try {
      await folder.delete();
    } catch (err) {
      errors.push(`Error cleaning up stale project "${req.body.name}" _id=${project._id}`);
    }

    throw new RequestError(errorMessages.create, 400, errors);
  }

  ctrl.setLocationId(project._id.toString());

  return project;
}

async function readManyProjects(req) {
  const userId = req.user.userId;

  const folderId = ObjectId(req.params.folderId);
  const list = req.params.ids.split(",");
  const results = await projectRepository.readManyProjects(userId, list);
  if (!results || results.length < 1) {
    throw new NotFoundError("No projects found.");
  }

  return results.filter(prj => prj.parentFolderIds.findIndex(id => id.equals(folderId)) >= 0);
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
  createProject,
  readManyProjects,
  errorMessages
};
