/* eslint-disable no-unused-vars, indent */

const { expect } = require("chai");

// Dependencies
const { executeMiddleware, executeMiddlewareAsync, trace } = require("../test-utils/express-shim");
const mockUserRepo = require("../mockRepositories/users.model.mock");
const mockFolderRepo = require("../mockRepositories/folders.model.mock");

// Module under test
const foldersCtrl = require("../../controllers/folders.ctrl");

describe.only("folders.ctrl", () => {
  before(() => {
    // restFactory.init({ 
    //   traceOn: true,
    //   errorLogger: err => console.trace(err) 
    // });

    mockUserRepo.initialize();
    mockUserRepo.reset();

    mockFolderRepo.initialize();
  });

  after(() => {
    mockUserRepo.finalize();
    mockFolderRepo.finalize();
  });

  const mockNewFolder = {
    name: "New Folder",
    parentId: null,
    isActive: true
  };

  describe("getAllFolders", () => {
    before(() => {
      mockFolderRepo.reset();
    });

    it("should read all folders belonging to the user", async () => {
      const result = await executeMiddlewareAsync({
          user: {...mockUserRepo.credentials.adminCreds},
        },
        foldersCtrl.getAllFolders
      );

      expect(result.body.success).to.be.true;
      expect(result.status).to.equal(200);
      expect(result.body.data).to.deep.equal([
        {
          "id": mockFolderRepo.constants.externalTodoId,
          "name": "External TODO",
          "parentId": null,
          "projectIds": [],
          "isActive": true,
          "children": []
        },
        {
          "id": mockFolderRepo.constants.sprintsId,
          "name": "Sprints",
          "parentId": null,
          "projectIds": [],
          "isActive": true,
          "children": [
            {
              "id": mockFolderRepo.constants.sprint1Id,
              "name": "Q4 Sprint 3 (3.53) – October 30, 2019",
              "parentId": mockFolderRepo.constants.sprintsId,
              "projectIds": [],
              "isActive": true,
              "children": []
            },
            {
              "id": mockFolderRepo.constants.sprint2Id,
              "name": "Q4 Sprint 4 (3.54) – November 13, 2019",
              "parentId": mockFolderRepo.constants.sprintsId,
              "projectIds": [],
              "isActive": true,
              "children": []
            }
          ]
        }
      ]);
    });
  });

  describe("getOneFolder", () => {
    it("should read one folder by folderId", async () => {
      const result = await executeMiddlewareAsync({
          user: {...mockUserRepo.credentials.adminCreds},
          params: { id: mockFolderRepo.constants.sprintsId }
        },
        foldersCtrl.getOneFolder
      );

      expect(result.body.success).to.be.true;
      expect(result.status).to.equal(200);
      expect(result.body.data).to.deep.equal({
        id: mockFolderRepo.constants.sprintsId,
        name: "Sprints",
        parentId: null,
        projectIds: [],
        isActive: true,
        childrenIds: [
          mockFolderRepo.constants.sprint1Id,
          mockFolderRepo.constants.sprint2Id
        ],
        projectIds: [],
        isActive: true,
        name: "Sprints",
        userId: mockUserRepo.constants.adminUserId,
        createdBy: mockUserRepo.constants.adminUserId,
        updatedBy: mockUserRepo.constants.adminUserId,
        createdAt: "2019-11-26T23:41:11.414Z",
        updatedAt: "2019-11-27T15:52:32.980Z"    
      });
    });

    it("should return a 404 for a folder that exists, but does not belong to the user", async () => {
      const result = await executeMiddlewareAsync({
          user: {...mockUserRepo.credentials.adminCreds},
          params: { id: mockFolderRepo.constants.myProjectsId }
        },
        foldersCtrl.getOneFolder
      );
  
      expect(result.body.success).to.be.false;
      expect(result.status).to.equal(404);
    });

    it("should return a 404 for a folder that does not exist", async () => {
      const result = await executeMiddlewareAsync({
          user: {...mockUserRepo.credentials.adminCreds},
          params: { id: "beefbeefbeefbeefbeefbeef" }
        },
        foldersCtrl.getOneFolder
      );
  
      expect(result.body.success).to.be.false;
      expect(result.status).to.equal(404);
    });
  });
});