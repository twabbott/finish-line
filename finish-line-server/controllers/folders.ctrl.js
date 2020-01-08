const vet = require("../middleware/vet");

const { readFolderTree, createFolder, readOneFolder, updateFolder, deleteFolder, errorMessages } = require("../services/folder.service");
const { createMap } = require("../middleware/automapper");
const { asyncServiceWrapper, getResponse, postResponse, putResponse, deleteResponse } = require("../middleware/restFactory");
const { handleValidationErrors, handleMongoErrors } = require("../middleware/errorHandlers");

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

const validateFolderInfo = [
  vet({
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
  }),
  handleValidationErrors("Invalid folder info.")
];

module.exports = {
  getAllFolders: [
    asyncServiceWrapper(readFolderTree),
    handleMongoErrors(errorMessages.read),
    getResponse
  ],
  
  getOneFolder: [
    asyncServiceWrapper(readOneFolder),
    handleMongoErrors(errorMessages.read),
    cleanup.mapScalar,
    getResponse
  ],
    
  postFolder: [
    validateFolderInfo,
    asyncServiceWrapper(createFolder),
    handleMongoErrors(errorMessages.post),
    cleanup.mapScalar,
    postResponse
  ],

  putFolder: [
    validateFolderInfo,
    asyncServiceWrapper(updateFolder),
    handleMongoErrors(errorMessages.update),
    cleanup.mapScalar,
    putResponse
  ],

  deleteFolder: [
    asyncServiceWrapper(deleteFolder),
    handleMongoErrors(errorMessages.delete),
    deleteResponse
  ]
};
