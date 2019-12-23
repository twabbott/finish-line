const {
  makeGetMany,
  makeGetOne,
  makePost,
  makePut,
  makeDelete,
  autoMapper
} = require("./controllerFactory");

const foldersService = require("../services/folder.service");

const mapper = {
  allDetails: autoMapper({
    id: "_id",
    name: true,
    parentId: true,
    childrenIds: true,
    projectIds: true,
    userId: true,
    isActive: true,
    createdAt: true,
    createdBy: true,
    updatedAt: true,
    updatedBy: true
  }),
  treeView: autoMapper({
    id: "_id",
    name: true,
    parentId: true,
    childrenIds: true,
    projectIds: true,
    isActive: true
  })
};


const readAllFolders = makeGetMany(async (params, credentials) => {
  const folders = await foldersService.readMany(credentials.userId);

  const map = {};
  const rootFolders = [];

  folders.forEach(folder => {
    const copy = mapper.treeView(folder);
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
});

const readFolder = makeGetOne(async (params, credentials) => {
  const folder = await foldersService.readOne(params.id, credentials.userId);
  return mapper.allDetails(folder);
});

const createFolder = makePost(async (params, body, credentials) => {
  const newFolder = await foldersService.create(
    body.name, 
    credentials.userId,
    body.parentId,
    credentials.userId);

  return mapper.allDetails(newFolder);
});

const updateFolder = makePut(async (params, body, credentials) => {
  const folder = await foldersService.update(
    params.id,
    body.name,
    body.isActive,
    body.parentId,
    credentials.userId
  );

  return mapper.allDetails(folder);
});

const deleteFolder = makeDelete(async (params, credentials) => {  
  return await foldersService.delete(params.id, credentials.userId);
});

module.exports = {
  createFolder,
  readAllFolders,
  readFolder,
  updateFolder,
  deleteFolder
};
