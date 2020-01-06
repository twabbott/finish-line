const vet = require("../middleware/vet");
const restFactory = require("../middleware/restFactory");

const foldersService = require("../services/folder.service");
const { createMap } = require("../middleware/automapper");

const mapAll = createMap([
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

const validateFolderInfo = [vet({
    name: { type: String, required: true },
    parentId: { type: String, required: false, default: null },
    childrenIds: { type: Array, ofType: String, required: false },
    projectIds: {type: Array, ofType: String, required: false },
    isActive: { type: Boolean, default: false },
  }),
  (req, res, next) => {
    if (res.locals.errors) {
      return res.badRequest("Invalid folder info.", res.locals.errors);
    }

    next();
  }
];

async function getAllFolders(req, res, next) {
  const folders = await foldersService.readMany(req.user.userId);

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

  res.locals.result = rootFolders;
  next();
}

async function getOneFolder(req, res, next) {
  console.log("getOneFolder");
  res.locals.result = await foldersService.readOne(
    req.params.id, 
    req.user.userId);

  console.log("getOneFolder - done");
  next();
}

async function createFolder(req, res, next) {
  res.locals.result = await foldersService.create(
    req.data.name, 
    req.user.userId,
    req.data.parentId,
    req.user.userId
  );

  next();
}

async function updateFolder(req, res, next) {
  res.locals.result = await foldersService.update(
    req.params.id,
    req.data.name,
    req.data.isActive,
    req.data.parentId,
    req.user.userId
  );

  next();
}

async function deleteFolder(req, res, next) {  
  res.locals.result = await foldersService.delete(req.params.id, req.user.userId);

  next();
}

module.exports = {
  getAllFolders: [
    getAllFolders,
    restFactory.get
  ],
  
  getFolder: [
    getOneFolder,
    mapAll.mapScalar,
    restFactory.get
  ],
    
  postFolder: [
    validateFolderInfo,
    createFolder,
    mapAll.mapScalar,
    restFactory.post
  ],

  putFolder: [
    validateFolderInfo,
    updateFolder,
    mapAll.mapScalar,
    restFactory.put
  ],

  deleteFolder: [
    deleteFolder,
    restFactory.delete
  ]
};
