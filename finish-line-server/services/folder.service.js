const mongodb = require("mongodb");

const { folderRepository } = require("../models/folder.model");
const { RequestError, BadRequestError, NotFoundError } = require("../middleware/restFactory");

const errorMessages = {
  create: "Error creating folder",
  read: "Error reading folder(s)",
  update: "Error updating folder",
  delete: "Error deleting folder",
  general: "General error"
};

async function createFolder(req, ctrl) {
  const name = req.body.name;
  const userId = req.user.userId;
  const parentId = req.body.parentId;

  let parentFolder = null; 
  if (parentId) {
    parentFolder =  await folderRepository.readOneFolder(parentId, userId);
    if (!parentFolder) {
      throw new BadRequestError(errorMessages.create, `Folder with parentId=${parentId} not found.`);
    }
  }

  let folder = null;
  try {
    folder = folderRepository.createFolder({
      name,
      userId,
      parentId: parentFolder && parentFolder._id,
      childrenIds: [],
      projectIds: [],
      isActive: true,
      createdBy: userId,
      updatedBy: userId,
    });
  } catch(err) {    
    throw new BadRequestError(errorMessages.create, `Error creating new folder "${name}": ${err.message}`);
  }

  try {
    if (parentFolder) {
      await folderRepository.linkToParent(folder, parentFolder, userId);
    }
  } catch (err) {
    const errors = [err.message];
    // Clean up the folder we just created
    try {
      await folder.delete();
    } catch (err) {
      errors.push(`Error cleaning up stale folder "${name}" _id=${folder._id}`);
    }

    throw new RequestError(errorMessages.create, 400, errors);
  }

  ctrl.setLocationId(folder._id);

  return folder;
}

async function readFolderTree(req) {
  const folders = await folderRepository.readAllFolders(req.user.userId);
  if (!folders || folders.length < 1) {
    return [];
  }

  const map = {};
  const rootFolders = [];

  folders.forEach(folder => {
    const copy = {
      id: folder._id,
      name: folder.name,
      parentId: folder.parentId,
      childrenIds: folder.childrenIds,
      projectIds: folder.projectIds,
      isActive: folder.isActive
    };
    
    map[folder._id] = copy;
  });

  for (let k in map) {
    const folder = map[k];
    folder.children = [];
    folder.childrenIds.forEach(childId => folder.children.push(map[childId]));
    delete folder.childrenIds;
    if (!folder.parentId) {
      rootFolders.push(folder);
    }
  }

  return rootFolders;
}

async function readOneFolder(req) {
  const folder = folderRepository.readOneFolder(req.params.id, req.user.userId);
  if (!folder) {
    throw new NotFoundError(`Unable to find folder ${req.params.id}`);
  }

  return folder;
}

async function updateFolder(req) {
  const folderId = req.params.id;
  const { name, isActive, parentId } = req.body;
  const { userId } = req.user;

  const folder = await folderRepository.readOneFolder(folderId, userId);
  if (!folder) {
    throw new NotFoundError(`Unable to find folder ${req.params.id}`);
  }

  let newParentFolder = null; 
  if ((parentId && parentId.toString()) !== (folder.parentId && folder.parentId.toString())) {
    if (parentId) {
      if (parentId.toString() === folder._id.toString()) {
        throw new BadRequestError(errorMessages.update, "Cannot make a folder be its own parent.");
      }

      newParentFolder =  await folderRepository.readOneFolder(parentId, userId);

      if (!newParentFolder) {
        throw new BadRequestError(errorMessages.update, `Folder with parentId=${parentId} not found.`);
      }
    }

    try {
      await folderRepository.unlinkFromParent(folder, userId);
      await folderRepository.linkToParent(folder, newParentFolder, userId);
    } catch (err) {
      throw new BadRequestError(errorMessages.update, err.message);
    }
  }  

  folder.name = name;
  folder.isActive = isActive;
  folder.parentId = parentId;
  folder.updatedBy = userId;

  await folder.save();

  return folder;
}

async function deleteFolder(req) {
  const folderId = req.params.id;
  const { userId } = req.user;

  const folder = await folderRepository.readOneFolder(folderId, userId);
  if (!folder) {
    throw new NotFoundError(`Unable to find folder ${folderId}`);
  }

  // Can't delete an active folder.
  if (folder.isActive) {
    throw new BadRequestError(errorMessages.delete, "Cannot delete a folder unless it is marked as inactive");
  }

  // Unlink from parent
  try {
    await folderRepository.unlinkFromParent(folder, userId);
  } catch (err) {
    throw new BadRequestError(errorMessages.delete, err.message);
  }

  // Find _id for all that need to be deleted
  const allFolders = await folderRepository.readAllFolders(userId);
  const folderMap = {};
  allFolders.forEach(folder => folderMap[folder._id] = folder);

  const idList = [];

  function _findForDelete(rootId) {
    const folder = folderMap[rootId];
    if (!folder) {
      return;
    }
  
    idList.push(rootId);
  
    folder.childrenIds.forEach(f => _findForDelete(f));
  }
  
  _findForDelete(folder._id);

  // TODO: Unlink all projects

  // Delete all
  const count = folderRepository.deleteMany(userId, idList);
  return {
    count
  };
}

module.exports = {
  createFolder,
  readFolderTree,
  readOneFolder,
  updateFolder,
  deleteFolder,
  errorMessages
};
