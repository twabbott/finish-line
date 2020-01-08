const mongodb = require("mongodb");

const { folderSchema } = require("../models");
const { AppError } = require("../middleware/restFactory");

const errorMessages = {
  create: "Error creating folder",
  read: "Error reading folder(s)",
  update: "Error updating folder",
  delete: "Error deleting folder",
  general: "General error"
};

async function createFolder(req) {
  const name = req.body.name;
  const userId = req.user.userId;
  const parentId = req.body.parentId;

  let parentFolder = null; 
  if (parentId) {
    parentFolder =  await _findFolder(parentId, userId);
    if (!parentFolder) {
      throw new AppError(errorMessages.create, `Folder with parentId=${parentId} not found.`);
    }
  }

  const folder = new folderSchema();

  let created = false;
  try {
    folder.name = name;
    folder.userId = userId;
    folder.parentId = parentFolder && parentFolder._id;
    folder.childrenIds = [];
    folder.projectIds = [];
    folder.isActive = true;
    folder.createdBy = userId;
    folder.updatedBy = userId;
  
    await folder.save();
    created = true;

    if (parentFolder) {
      await _linkToParent(folder, parentFolder, userId);
    }
  } catch(err) {
    if (created) {
      // Clean up the folder we just created
      try {
        await folder.delete();
      } catch (err) {
        console.log(`Error cleaning up stale folder "${name}" _id=${folder._id}`);
      }
    }

    throw new AppError(errorMessages.create, `Error creating new folder ${name}: ${err.message}`);
  }

  return folder;
}

async function readFolderTree(req) {
  const folders = await readAllFolders(req);
  if (!folders || folders.length < 1) {
    return;
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

async function readAllFolders(req) {
  const { userId } = req.user;
  return await folderSchema.find({ userId });
}

async function readOneFolder(req) {
  await _findFolder(req.params.id, req.user.userId);
}

async function updateFolder(req) {
  const folderId = req.params.id;
  const { name, isActive, parentId } = req.body;
  const { userId } = req.user;

  const folder = await _findFolder(folderId, userId);
  if (!folder) {
    return;
  }

  let newParentFolder = null; 
  if ((parentId && parentId.toString()) !== (folder.parentId && folder.parentId.toString())) {
    if (parentId) {
      if (parentId.toString() === folder._id.toString()) {
        throw new AppError(errorMessages.update, "Cannot make a folder be its own parent.");
      }

      newParentFolder =  await _findFolder(parentId, userId);
      if (!newParentFolder) {
        throw new AppError(errorMessages.update, `Folder with parentId=${parentId} not found.`);
      }
    }

    await _unlinkFromParent(folder, userId);
    await _linkToParent(folder, newParentFolder, userId);
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

  const folder = await _findFolder(folderId, userId);
  if (!folder) {
    return 0;
  }

  // Can't delete an active folder.
  if (folder.isActive) {
    throw new AppError(errorMessages.delete, "Cannot delete a folder unless it is marked as inactive");
  }

  // Unlink from parent
  await _unlinkFromParent(folder, userId);

  // Find _id for all that need to be deleted
  const allFolders = await readAllFolders(req);
  const folderMap = _makeFolderMap(allFolders);

  const idList = [];
  _findForDelete(folderMap, idList, folder._id);

  // TODO: Unlink all projects

  // Delete all
  let result;
  try {
    result = await folderSchema.deleteMany({ userId, _id: { $in: idList }});
  } catch(err) {
    throw new AppError(errorMessages.delete, `Error deleting folder _id=${folderId} name=${folder.name}: ${err.message}`);
  }

  return (result && result.deletedCount) || 0;
}

async function _findFolder(folderId, userId) {
  if (!mongodb.ObjectID.isValid(folderId)) {
    return null;
  }

  return await folderSchema.findOne({ _id: folderId, userId: userId });
}

function _makeFolderMap(allFolders) {  
  const folderMap = {};
  allFolders.forEach(folder => folderMap[folder._id] = folder);
  return folderMap;
}

function _findForDelete(folderMap, idList, rootId) {
  const folder = folderMap[rootId];
  if (!folder) {
    return;
  }

  idList.push(rootId);

  folder.childrenIds.forEach(f => _findForDelete(folderMap, idList, f._id));
}

async function _unlinkFromParent(folder, userId) {
  if (!folder.parentId) {
    //console.log(`UNLINK: folder ${folder.name} has no parent`);
    return;
  }

  const parentFolder = await _findFolder(folder.parentId, userId);
  if (!parentFolder) {
    //console.log(`UNLINK: cannot find parent of folder "${folder.name}".  parentId=${folder.parentId}`);
    return;
  }

  try {
    //console.log(`UNLINK: children before ${JSON.stringify(parentFolder.childrenIds)}`);
    parentFolder.childrenIds = parentFolder.childrenIds.filter(id => id.toString() !== folder._id.toString());
    await parentFolder.save();
    //console.log(`UNLINK: children after ${JSON.stringify(parentFolder.childrenIds)}`);
  } catch (err) {
    throw new AppError(errorMessages.general, `Error unlinking from parent folder _id=${parentFolder._id} name="${parentFolder.name}": ${err.message}`);
  }
}

async function _linkToParent(childFolder, parentFolder, userId) {
  if (!parentFolder) {
    return;
  }
  
  if (parentFolder.childrenIds.findIndex(id => id === childFolder._id) >= 0) {
    return;
  }

  try {
    parentFolder.childrenIds = [...parentFolder.childrenIds, childFolder._id];
    parentFolder.updatedBy = userId;
    await parentFolder.save();
  } catch (err) {
    throw new AppError(errorMessages.general, `Error linking to parent folder _id=${parentFolder._id} name="${parentFolder.name}": ${err.message}`);
  } 
}

module.exports = {
  createFolder,
  readFolderTree,
  readAllFolders,
  readOneFolder,
  updateFolder,
  deleteFolder,
  errorMessages
};
