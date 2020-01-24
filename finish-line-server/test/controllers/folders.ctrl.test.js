/* eslint-disable no-unused-vars, indent */

const { expect } = require("chai");
const sinon = require("sinon");

// Dependencies
const { executeMiddleware, executeMiddlewareAsync, trace } = require("../test-utils/express-shim");
const mockUserRepo = require("../mockRepositories/users.model.mock");
const mockFolderRepo = require("../mockRepositories/folders.model.mock");
const regex = require("../../shared/regex");

// Module under test
const foldersCtrl = require("../../controllers/folders.ctrl");
const folderService = require("../../services/folder.service");
const folderModel = require("../../models/folder.model");

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

    it("should read all folders belonging to user 1", async () => {
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

    it("should read all folders belonging to user 2", async () => {
      const result = await executeMiddlewareAsync({
          user: {...mockUserRepo.credentials.normalCreds},
        },
        foldersCtrl.getAllFolders
      );

      expect(result.body.success).to.be.true;
      expect(result.status).to.equal(200);
      expect(result.body.data).to.deep.equal([
        {
          "id": mockFolderRepo.constants.myProjectsId,
          "name": "My Projects",
          "parentId": null,
          "projectIds": [],
          "isActive": true,
          "children": []
        }
      ]);
    });
  });

  describe("getOneFolder", () => {
    it("should read one folder by folderId for user1", async () => {
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

    it("should read one folder by folderId for user2", async () => {
      const result = await executeMiddlewareAsync({
          user: {...mockUserRepo.credentials.normalCreds},
          params: { id: mockFolderRepo.constants.myProjectsId }
        },
        foldersCtrl.getOneFolder
      );

      expect(result.body.success).to.be.true;
      expect(result.status).to.equal(200);
      expect(result.body.data).to.deep.equal({
        id: mockFolderRepo.constants.myProjectsId,
        parentId: null,
        childrenIds: [],
        projectIds: [],
        name: "My Projects",
        userId: mockUserRepo.constants.normalUserId,
        createdAt: "2019-09-25T22:11:45.372Z",
        createdBy: mockUserRepo.constants.normalUserId,
        updatedAt: "2020-01-08T17:54:40.433Z",
        updatedBy: mockUserRepo.constants.normalUserId,
        isActive: true
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

  describe("postFolder", () => {
    it("should create a new top-level folder", async () => {
      const result = await executeMiddlewareAsync({
          user: {...mockUserRepo.credentials.adminCreds},
          body: {...mockNewFolder}
        },
        foldersCtrl.postFolder
      );

      const { data } = result.body;
      expect(result.body.success).to.be.true;
      expect(result.status).to.equal(201);
      expect(regex.objectId.test(data.id)).to.be.true;
      expect(data.name).to.equal(mockNewFolder.name);
      expect(data.parentId).to.be.null;
      expect(data.projectIds).to.deep.equal([]);
      expect(data.isActive).to.be.true;
      expect(data.childrenIds).to.deep.equal([]);
      expect(data.userId).to.equal(mockUserRepo.constants.adminUserId);
      expect(data.createdBy).to.equal(mockUserRepo.constants.adminUserId);
      expect(data.updatedBy).to.equal(mockUserRepo.constants.adminUserId);
      expect(isNaN(Date.parse(data.createdAt))).to.be.false;
      expect(isNaN(Date.parse(data.updatedAt))).to.be.false;
    });

    it("should create a new child folder", async () => {
      const result = await executeMiddlewareAsync({
          user: {...mockUserRepo.credentials.adminCreds},
          body: {
            ...mockNewFolder, 
            parentId: mockFolderRepo.constants.sprintsId
          }
        },
        foldersCtrl.postFolder
      );

      const { data } = result.body;
      expect(result.body.success).to.be.true;
      expect(result.status).to.equal(201);
      expect(regex.objectId.test(data.id)).to.be.true;
      expect(data.name).to.equal(mockNewFolder.name);
      expect(data.parentId).to.equal(mockFolderRepo.constants.sprintsId);
      expect(data.projectIds).to.deep.equal([]);
      expect(data.isActive).to.be.true;
      expect(data.childrenIds).to.deep.equal([]);
      expect(data.userId).to.equal(mockUserRepo.constants.adminUserId);
      expect(data.createdBy).to.equal(mockUserRepo.constants.adminUserId);
      expect(data.updatedBy).to.equal(mockUserRepo.constants.adminUserId);
      expect(isNaN(Date.parse(data.createdAt))).to.be.false;
      expect(isNaN(Date.parse(data.updatedAt))).to.be.false;

      // Make sure that linkToParent did its thing
      const parentDoc = mockFolderRepo.stubs.readOneFolder(mockFolderRepo.constants.sprintsId, mockUserRepo.constants.adminUserId);
      expect(parentDoc.childrenIds).to.contain(data.id);
    });

    it("should fail validation for missing required parameters", async () => {
      const result = await executeMiddlewareAsync({
          user: {...mockUserRepo.credentials.adminCreds},
          body: {}
        },
        foldersCtrl.postFolder
      );

      expect(result.body.success).to.be.false;
      expect(result.status).to.equal(400);
      expect(result.body.errors).to.deep.equal([
        { property: "name", message: "is required" } 
      ]);
    });

    it("should supply defalut values for missing parameters that are not required", async () => {
      const result = await executeMiddlewareAsync({
          user: {...mockUserRepo.credentials.adminCreds},
          body: {
            name: "foo"
          }
        },
        foldersCtrl.postFolder
      );

      const { data } = result.body;
      expect(result.body.success).to.be.true;
      expect(result.status).to.equal(201);
      expect(regex.objectId.test(data.id)).to.be.true;
      expect(data.name).to.equal("foo");
      expect(data.parentId).to.be.null;
      expect(data.projectIds).to.deep.equal([]);
      expect(data.isActive).to.be.true;
      expect(data.childrenIds).to.deep.equal([]);
      expect(data.userId).to.equal(mockUserRepo.constants.adminUserId);
      expect(data.createdBy).to.equal(mockUserRepo.constants.adminUserId);
      expect(data.updatedBy).to.equal(mockUserRepo.constants.adminUserId);
      expect(isNaN(Date.parse(data.createdAt))).to.be.false;
      expect(isNaN(Date.parse(data.updatedAt))).to.be.false;
    });

    describe("error handling", () => {
      let linkToParentStub = undefined;

      afterEach(() => {
        mockFolderRepo.finalize(); // Get rid of overridden stubs
        mockFolderRepo.initialize();

        if (linkToParentStub) {
          linkToParentStub.reset();
        }
      });

      it("should return 400 if repository throws an exception", async () => {
        mockFolderRepo.stubs.createFolder
          .throws(new Error("foobar!"));
  
        const result = await executeMiddlewareAsync({
            user: {...mockUserRepo.credentials.adminCreds},
            body: {...mockNewFolder}
          },
          foldersCtrl.postFolder
        );

        expect(result.body.success).to.be.false;
        expect(result.status).to.equal(400);
        expect(result.body.message).to.equal(folderService.errorMessages.create);
        expect(result.body.errors).to.deep.equal([
          "Error creating new folder \"New Folder\": foobar!"
        ]);
      });
  
      it("should return 400 if you try to link to a parent that is not yours", async () => {
        const result = await executeMiddlewareAsync({
            user: {...mockUserRepo.credentials.adminCreds},
            body: {
              ...mockNewFolder,
              parentId: mockFolderRepo.constants.myProjectsId
            }
          },
          foldersCtrl.postFolder
        );

        expect(result.body.success).to.be.false;
        expect(result.status).to.equal(400);
        expect(result.body.message).to.equal(folderService.errorMessages.create);
        expect(result.body.errors).to.deep.equal([
          "Folder with parentId=5d8be621f1a18d4d701f18ff not found."
        ]);
      });
  
      it("should return 400 if you try to link to a parent that doesn't exist", async () => {
        const result = await executeMiddlewareAsync({
            user: {...mockUserRepo.credentials.adminCreds},
            body: {
              ...mockNewFolder,
              parentId: "beefbeefbeefbeefbeefbeef"
            }
          },
          foldersCtrl.postFolder
        );

        expect(result.body.success).to.be.false;
        expect(result.status).to.equal(400);
        expect(result.body.message).to.equal(folderService.errorMessages.create);
        expect(result.body.errors).to.deep.equal([
          "Folder with parentId=beefbeefbeefbeefbeefbeef not found."
        ]);
      });
  
      it("should return 400 if additional cleanup fails, after create fails", async () => {
        linkToParentStub = sinon
          .stub(folderModel.folderRepository, "linkToParent")
          .throws(new Error("Yeeet!"));

        const result = await executeMiddlewareAsync({
            user: {...mockUserRepo.credentials.adminCreds},
            body: {
              ...mockNewFolder,
              parentId: mockFolderRepo.constants.sprintsId
            }
          },
          foldersCtrl.postFolder
        );

        expect(result.body.success).to.be.false;
        expect(result.status).to.equal(400);
        expect(result.body.message).to.equal(folderService.errorMessages.create);
        expect(result.body.errors[0]).to.equal("Yeeet!");
        expect(result.body.errors[1]).to.contain(`Error cleaning up stale folder \"${mockNewFolder.name}\"`);
      });
    });
  });
});