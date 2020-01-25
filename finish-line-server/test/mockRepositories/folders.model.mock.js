// 3rd party
const sinon = require("sinon");
const { ObjectId } = require("mongodb");

const { folderRepository } = require("../../models/folder.model");
const usersModelMock = require("./users.model.mock")

const constants = Object.freeze({
  externalTodoId: "5d8be621f1a18d4d701f1885",
  sprintsId: "5dddb817d267f984a4aee81f",
  sprintOneId: "5dddc3a9c5b897859467563b",
  sprintTwoId: "5dddc3a9c5b8978594675630",
  myProjectsId: "5d8be621f1a18d4d701f18ff"
});

const documentCollection = [];

const documents = Object.freeze({
  externalTodo: {
    _id: constants.externalTodoId,
    parentId: null,
    childrenIds: [],
    projectIds: [],
    name: "External TODO",
    userId: usersModelMock.constants.adminUserId,
    createdAt: "2019-09-25T22:11:45.372Z",
    createdBy: usersModelMock.constants.adminUserId,
    updatedAt: "2020-01-08T17:54:40.433Z",
    updatedBy: usersModelMock.constants.adminUserId,
    __v: 32,
    isActive: true
  },

  sprints: {
    _id: constants.sprintsId,
    parentId: null,
    childrenIds: [
      constants.sprintOneId,
      constants.sprintTwoId
    ],
    projectIds: [],
    isActive: true,
    name: "Sprints",
    userId: usersModelMock.constants.adminUserId,
    createdBy: usersModelMock.constants.adminUserId,
    updatedBy: usersModelMock.constants.adminUserId,
    createdAt: "2019-11-26T23:41:11.414Z",
    updatedAt: "2019-11-27T15:52:32.980Z",
    __v: 2
  },

  sprintOne: {
    _id: constants.sprintOneId,
    parentId: constants.sprintsId,
    childrenIds: [],
    projectIds: [],
    isActive: true,
    name: "Q4 Sprint 3 (3.53) – October 30, 2019",
    userId: usersModelMock.constants.adminUserId,
    createdBy: usersModelMock.constants.adminUserId,
    updatedBy: usersModelMock.constants.adminUserId,
    createdAt: "2019-11-27T00:30:33.082Z",
    updatedAt: "2019-11-29T06:17:50.058Z",
    __v: 27
  },

  sprintTwo: {
    _id: constants.sprintTwoId,
    parentId: constants.sprintsId,
    childrenIds: [],
    projectIds: [],
    isActive: true,
    name: "Q4 Sprint 4 (3.54) – November 13, 2019",
    userId: usersModelMock.constants.adminUserId,
    createdBy: usersModelMock.constants.adminUserId,
    updatedBy: usersModelMock.constants.adminUserId,
    createdAt: "2019-11-27T00:30:33.082Z",
    updatedAt: "2019-11-29T06:17:50.058Z",
    __v: 27
  },

  myProjects: {
    _id: constants.myProjectsId,
    parentId: null,
    childrenIds: [],
    projectIds: [],
    name: "My Projects",
    userId: usersModelMock.constants.normalUserId,
    createdAt: "2019-09-25T22:11:45.372Z",
    createdBy: usersModelMock.constants.normalUserId,
    updatedAt: "2020-01-08T17:54:40.433Z",
    updatedBy: usersModelMock.constants.normalUserId,
    __v: 32,
    isActive: true
  }
});

const stubs = {
  createFolder: undefined,
  readAllFolders: undefined,
  readOneFolder: undefined,
  deleteAll: undefined,
  deleteMany: undefined
};

function initialize() {
  stubs.createFolder = sinon
    .stub(folderRepository, "createFolder")
    .callsFake(folder => {
      const now = (new Date).toISOString();
      const newDoc = {
        _id: ObjectId().toString(),
        ...folder,
        createdAt: now,
        createdBy: folder.userId,
        updatedAt: now,
        updatedBy: folder.userId
      };

      documentCollection.push(newDoc);
      return newDoc;
    });

  stubs.readAllFolders = sinon
    .stub(folderRepository, "readAllFolders")
    .callsFake(userId => {
      return documentCollection.filter(doc => doc.userId === userId);
    });

  stubs.readOneFolder = sinon
    .stub(folderRepository, "readOneFolder")
    .callsFake((folderId, userId) => documentCollection.find(folder => folder._id === folderId && folder.userId === userId));

  stubs.deleteAll = sinon
    .stub(folderRepository, "deleteAll")
    .callsFake(userId => {
      const remainder = documentCollection.filter(folder => folder.userId !== userId);
      documentCollection.length = 0;
      remainder.forEach(folder => documentCollection.push(folder));
    });

  stubs.deleteMany = sinon
    .stub(folderRepository, "deleteMany")
    .callsFake((userId, list) => {
      const remainder = documentCollection.filter(
        folder => 
          (folder.userId === userId && (list.findIndex(id => folder._id === id) < 0)) ||
          (folder.userId !== userId)
      );
      const firstCount = documentCollection.length;
      documentCollection.length = 0;
      remainder.forEach(folder => documentCollection.push(folder));
      return firstCount - remainder.length;
    });
}

function finalize() {
  stubs.createFolder.restore();
  stubs.readAllFolders.restore();
  stubs.readOneFolder.restore();
  stubs.deleteAll.restore();
  stubs.deleteMany.restore();
}

function reset() {
  const mockFuncs = {
    save: () => {}
  };

  documentCollection.length = 0;
  for (let doc in documents) {
    documentCollection.push({
      ...documents[doc],
      ...mockFuncs
    });
  }

  return documentCollection;
}

module.exports = {
  initialize,
  reset,
  finalize,
  stubs,
  constants,
  documents
};
