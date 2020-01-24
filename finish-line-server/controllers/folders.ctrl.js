const { createFolder, readFolderTree, readOneFolder, updateFolder, deleteFolder, errorMessages } = require("../services/folder.service");
const { createMap } = require("../middleware/automapper");
const { serviceWrapper, getResponse, postResponse, putResponse, deleteResponse } = require("../middleware/restFactory");
const { validateRequestBody, handleMongoErrors } = require("../middleware/errorHandlers");

const cleanup = createMap([
  ["_id", "id"],
  "name", 
  "parentId", 
  "childrenIds", 
  "projectIds", 
  "userId", 
  "isActive", 
  "createdAt", 
  "createdBy", 
  "updatedAt", 
  "updatedBy", 
]);

const folderInfoSchema = {
  name: { 
    type: String, 
    required: true 
  },
  parentId: { 
    type: String, 
    default: null
  },
  isActive: { 
    type: Boolean, 
    default: true 
  },
};

const validateFolderInfo = validateRequestBody(folderInfoSchema);

module.exports = {
  getAllFolders: [
    serviceWrapper.callAsync(readFolderTree),
    handleMongoErrors(errorMessages.read),
    getResponse
  ],
  
  getOneFolder: [
    serviceWrapper.callAsync(readOneFolder),
    handleMongoErrors(errorMessages.read),
    cleanup.mapScalar,
    getResponse
  ],

  postFolder: [
    validateFolderInfo,
    serviceWrapper.callAsync(createFolder),
    handleMongoErrors(errorMessages.post),
    cleanup.mapScalar,
    postResponse
  ],

  putFolder: [
    validateFolderInfo,
    serviceWrapper.callAsync(updateFolder),
    handleMongoErrors(errorMessages.update),
    cleanup.mapScalar,
    putResponse
  ],

  deleteFolder: [
    serviceWrapper.callAsync(deleteFolder),
    handleMongoErrors(errorMessages.delete),
    deleteResponse
  ]
};
