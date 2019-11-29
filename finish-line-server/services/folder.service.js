const { folderSchema } = require("../models/folder.model");
const { AppError } = require("../shared");

async function create(name, userId, parentId, createdBy) {
  let parentFolder = null; 
  if (parentId) {
    parentFolder =  await readOne(parentId, userId);
    if (!parentFolder) {
      throw new AppError(`Folder with parentId=${parentId} not found.`);
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
    folder.createdBy = createdBy;
    folder.updatedBy = createdBy;
  
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

    throw new AppError(`Error creating new folder ${name}: ${err.message}`);
  }

  return folder;
}

async function readMany(userId) {
  let list;

  try {
    list = await folderSchema.find({ userId });
  } catch(err) {
    throw new AppError(`Error reading folders for userId ${userId}: ${err.message}`);
  }

  return list;
}

async function readOne(folderId, userId) {
  if (!folderId) {
    return null;
  }

  let folder;
  try {
    folder = await folderSchema.findOne({ _id: folderId, userId: userId });
  } catch(err) {
    throw new AppError(`Cannot find folder with _id=${folderId}: ${err.message}`);
  }

  return folder; 
}

async function update(folderId, name, isActive, parentId, userId) {
  let folder;
  
  try {
    folder = await readOne(folderId, userId);
    if (!folder) {
      return null;
    }

    let newParentFolder = null; 
    if ((parentId && parentId.toString()) !== (folder.parentId && folder.parentId.toString())) {
      if (parentId) {
        if (parentId.toString() === folder._id.toString()) {
          throw new AppError("Cannot make a folder be its own parent.");
        }
  
        newParentFolder =  await readOne(parentId, userId);
        if (!newParentFolder) {
          throw new AppError(`Folder with parentId=${parentId} not found.`);
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
  } catch(err) {
    throw new AppError(`Cannot update folder _id=${folderId}: ${err.message}`);
  }

  return folder;
}

async function $delete(folderId, userId) {
  const folder = await readOne(folderId, userId);
  if (!folder) {
    return 0;
  }

  // Can't delete an active folder.
  if (folder.isActive) {
    throw new AppError("Cannot delete a folder unless it is marked as inactive");
  }

  // Unlink from parent
  await _unlinkFromParent(folder, userId);

  // Find _id for all that need to be deleted
  const allFolders = await readMany(userId);
  const folderMap = _makeFolderMap(allFolders);

  const idList = [];
  _findForDelete(folderMap, idList, folder._id);

  // TODO: Unlink all projects

  // Delete all
  let result;
  try {
    result = await folderSchema.deleteMany({ userId, _id: { $in: idList }});
  } catch(err) {
    throw new AppError(`Error deleting folder _id=${folderId} name=${folder.name}: ${err.message}`);
  }

  return (result && result.deletedCount) || 0;
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

  const parentFolder = await readOne(folder.parentId, userId);
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
    throw new AppError(`Error unlinking from parent folder _id=${parentFolder._id} name="${parentFolder.name}": ${err.message}`);
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
    throw new AppError(`Error linking to parent folder _id=${parentFolder._id} name="${parentFolder.name}": ${err.message}`);
  } 
}

module.exports = {
  create,
  readMany,
  readOne,
  update,
  delete: $delete
};
