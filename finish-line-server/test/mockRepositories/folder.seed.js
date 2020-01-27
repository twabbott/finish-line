const { folderSchema, folderRepository } = require("../../models/folder.model");

const keys = {
  externalTodoId: undefined,
  sprintsId: undefined,
  sprintOneId: undefined,
  sprintTwoId: undefined,
  myProjectsId: undefined
};

async function resetAll(userKeys) {
  await folderSchema.deleteMany();

  const externalTodoFolder = await folderRepository.createFolder({
    name: "External TODO",
    userId: userKeys.adminUserId,
    parentId: null,
    childrenIds: [],
    projectIds: [],
    isActive: true,
    createdBy: userKeys.adminUserId,
    updatedBy: userKeys.adminUserId
  });

  keys.externalTodoId = externalTodoFolder._id;

  const sprintsFolder = await folderRepository.createFolder({
    name: "Sprints",
    userId: userKeys.adminUserId,
    parentId: null,
    childrenIds: [],
    projectIds: [],
    isActive: true,
    createdBy: userKeys.adminUserId,
    updatedBy: userKeys.adminUserId,
  });

  keys.sprintsId = sprintsFolder._id;

  const sprintOneFolder = await folderRepository.createFolder({
    name: "Q4 Sprint 3 (3.53) – October 30, 2019",
    userId: userKeys.adminUserId,
    parentId: keys.sprintsId,
    childrenIds: [],
    projectIds: [],
    isActive: true,
    createdBy: userKeys.adminUserId,
    updatedBy: userKeys.adminUserId,
  });

  keys.sprintOneId = sprintOneFolder._id;

  const sprintTwoFolder = await folderRepository.createFolder({
    name: "Q4 Sprint 4 (3.54) – November 13, 2019",
    userId: userKeys.adminUserId,
    parentId: keys.sprintsId,
    childrenIds: [],
    projectIds: [],
    isActive: true,
    createdBy: userKeys.adminUserId,
    updatedBy: userKeys.adminUserId,
  });

  keys.sprintTwoId = sprintTwoFolder._id;

  const myProjectsFolder = await folderRepository.createFolder({
    name: "My Projects",
    userId: userKeys.normalUserId,
    parentId: null,
    childrenIds: [],
    projectIds: [],
    isActive: true,
    createdBy: userKeys.normalUserId,
    updatedBy: userKeys.normalUserId,
  });

  keys.myProjectsId = myProjectsFolder._id;

  /********************************/
  sprintsFolder.childrenIds = [
    keys.sprintOneId,
    keys.sprintTwoId
  ];
  await sprintsFolder.save();
}

module.exports = {
  keys,
  resetAll
};