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

  let linkToParentStub = undefined;
  let unlinkFromParentStub = undefined;

  afterEach(() => 
    (linkToParentStub && linkToParentStub.restore()),
    (unlinkFromParentStub && unlinkFromParentStub.restore())
  );

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
              "id": mockFolderRepo.constants.sprintOneId,
              "name": "Q4 Sprint 3 (3.53) – October 30, 2019",
              "parentId": mockFolderRepo.constants.sprintsId,
              "projectIds": [],
              "isActive": true,
              "children": []
            },
            {
              "id": mockFolderRepo.constants.sprintTwoId,
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
          mockFolderRepo.constants.sprintOneId,
          mockFolderRepo.constants.sprintTwoId
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
      expect(result.headers).to.deep.equal({ Location: `http://blah.com//${data.id}` });

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
      afterEach(() => {
        mockFolderRepo.finalize(); // Get rid of overridden stubs
        mockFolderRepo.initialize();
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

  describe("putFolder", () => {
    beforeEach(() => {
      mockFolderRepo.reset();
    });

    it("should update basic properties on an existing folder", async () => {
      const doc = mockFolderRepo.stubs.readOneFolder(mockFolderRepo.constants.externalTodoId, mockUserRepo.constants.adminUserId);
      doc.updatedby = "??";

      const result = await executeMiddlewareAsync({
          user: {...mockUserRepo.credentials.adminCreds},
          params: {id: mockFolderRepo.constants.externalTodoId},
          body: {
            name: "New name",
            isActive: false,
          }
        },
        foldersCtrl.putFolder
      );

      const { data } = result.body;
      expect(result.body.success).to.be.true;
      expect(result.status).to.equal(200);
      expect(regex.objectId.test(data.id)).to.be.true;
      expect(data.name).to.equal("New name");
      expect(data.parentId).to.be.null;
      expect(data.projectIds).to.deep.equal([]);
      expect(data.isActive).to.be.false;
      expect(data.childrenIds).to.deep.equal([]);
      expect(data.userId).to.equal(mockUserRepo.constants.adminUserId);
      expect(data.createdBy).to.equal(mockUserRepo.constants.adminUserId);
      expect(data.updatedBy).to.equal(mockUserRepo.constants.adminUserId);
    });

    it("should move a top-level folder to a designated parent folder", async () => {
      const doc = mockFolderRepo.documents.externalTodo;

      const result = await executeMiddlewareAsync({
          user: {...mockUserRepo.credentials.adminCreds},
          params: {id: doc._id},
          body: {
            name: doc.name,
            parentId: mockFolderRepo.constants.sprintsId
          }
        },
        foldersCtrl.putFolder
      );

      const { data } = result.body;

      expect(result.body.success).to.be.true;
      expect(result.status).to.equal(200);
      expect(data.name).to.equal(doc.name);
      expect(data.id).to.equal(doc._id);
      expect(data.parentId).to.equal(mockFolderRepo.constants.sprintsId);
      expect(data.isActive).to.be.true;

      // Make sure the parent knows
      const parentDoc = mockFolderRepo.stubs.readOneFolder(mockFolderRepo.constants.sprintsId, mockUserRepo.constants.adminUserId);
      expect(parentDoc.childrenIds).to.contain(doc._id);
    });

    it("should move a child folder to the top level", async () => {
      const doc = mockFolderRepo.documents.sprintTwo;

      const result = await executeMiddlewareAsync({
          user: {...mockUserRepo.credentials.adminCreds},
          params: {id: doc._id},
          body: {
            name: doc.name,
            parentId: null
          }
        },
        foldersCtrl.putFolder
      );

      const { data } = result.body;

      expect(result.body.success).to.be.true;
      expect(result.status).to.equal(200);
      expect(data.name).to.equal(doc.name);
      expect(data.id).to.equal(doc._id);
      expect(data.parentId).to.be.null;
      expect(data.isActive).to.be.true;

      // Make sure the parent knows
      const parentDoc = mockFolderRepo.stubs.readOneFolder(mockFolderRepo.constants.sprintsId, mockUserRepo.constants.adminUserId);
      expect(parentDoc.childrenIds).to.not.contain(doc._id);
    });

    it("should move a child folder to the top level", async () => {
      const doc = mockFolderRepo.documents.sprintTwo;

      const result = await executeMiddlewareAsync({
          user: {...mockUserRepo.credentials.adminCreds},
          params: {id: doc._id},
          body: {
            name: doc.name,
            parentId: mockFolderRepo.constants.sprintOneId
          }
        },
        foldersCtrl.putFolder
      );

      const { data } = result.body;

      expect(result.body.success).to.be.true;
      expect(result.status).to.equal(200);
      expect(data.name).to.equal(doc.name);
      expect(data.id).to.equal(doc._id);
      expect(data.parentId).to.equal(mockFolderRepo.constants.sprintOneId);
      expect(data.isActive).to.be.true;

      // Make sure the old parent knows
      const oldParentDoc = mockFolderRepo.stubs.readOneFolder(mockFolderRepo.constants.sprintsId, mockUserRepo.constants.adminUserId);
      expect(oldParentDoc.childrenIds).to.not.contain(doc._id);

      // Make sure the new parent knows
      const newParentDoc = mockFolderRepo.stubs.readOneFolder(mockFolderRepo.constants.sprintOneId, mockUserRepo.constants.adminUserId);
      expect(newParentDoc.childrenIds).to.contain(doc._id);
    });

    it("should return a 404 if you try to update a folder you don't own", async () => {
      const doc = mockFolderRepo.documents.sprintTwo;

      const result = await executeMiddlewareAsync({
          user: {...mockUserRepo.credentials.normalCreds},
          params: {id: doc._id},
          body: {
            name: "foobar"
          }
        },
        foldersCtrl.putFolder
      );

      expect(result.body.success).to.be.false;
      expect(result.status).to.equal(404);
      expect(result.body.message).to.contain("Unable to find folder");
    });

    it("should return a 404 if you try to update a folder that does not exist", async () => {
      const doc = mockFolderRepo.documents.sprintTwo;

      const result = await executeMiddlewareAsync({
          user: {...mockUserRepo.credentials.normalCreds},
          params: {id: "beefbeefbeefbeefbeefbeef"},
          body: {
            name: "foobar"
          }
        },
        foldersCtrl.putFolder
      );

      expect(result.body.success).to.be.false;
      expect(result.status).to.equal(404);
      expect(result.body.message).to.contain("Unable to find folder");
    });

    describe("error handling", () => {
      it("should not let a folder become its own parent", async () => {
        const doc = mockFolderRepo.documents.sprintTwo;
  
        const result = await executeMiddlewareAsync({
            user: {...mockUserRepo.credentials.adminCreds},
            params: {id: doc._id},
            body: {
              name: doc.name,
              parentId: doc._id
            }
          },
          foldersCtrl.putFolder
        );

        expect(result.body.success).to.be.false;
        expect(result.status).to.equal(400);
        expect(result.body.message).to.contain("Error updating folder");
        expect(result.body.errors).to.deep.equal([ "Cannot make a folder be its own parent." ]);
      });

      it("should not let a folder become a child of another user's folder", async () => {
        const doc = mockFolderRepo.documents.sprintTwo;
  
        const result = await executeMiddlewareAsync({
            user: {...mockUserRepo.credentials.adminCreds},
            params: {id: doc._id},
            body: {
              name: doc.name,
              parentId: mockFolderRepo.constants.myProjectsId
            }
          },
          foldersCtrl.putFolder
        );

        expect(result.body.success).to.be.false;
        expect(result.status).to.equal(400);
        expect(result.body.message).to.contain("Error updating folder");
        expect(result.body.errors[0]).to.deep.contain("not found");
      });

      it("should not let a folder become a child of a folder that does not exist", async () => {
        const doc = mockFolderRepo.documents.sprintTwo;
  
        const result = await executeMiddlewareAsync({
            user: {...mockUserRepo.credentials.adminCreds},
            params: {id: doc._id},
            body: {
              name: doc.name,
              parentId: "beefbeefbeefbeefbeefbeef"
            }
          },
          foldersCtrl.putFolder
        );

        expect(result.body.success).to.be.false;
        expect(result.status).to.equal(400);
        expect(result.body.message).to.contain("Error updating folder");
        expect(result.body.errors[0]).to.deep.contain("not found");
      });

      it("should handle if linking/unlinking throws an exception", async () => {
        linkToParentStub = sinon
          .stub(folderModel.folderRepository, "linkToParent")
          .throws(new Error("Yeeet!"));

        const doc = mockFolderRepo.documents.externalTodo;
  
        const result = await executeMiddlewareAsync({
            user: {...mockUserRepo.credentials.adminCreds},
            params: {id: doc._id},
            body: {
              name: doc.name,
              parentId: mockFolderRepo.constants.sprintsId
            }
          },
          foldersCtrl.putFolder
        );

        expect(result.body.success).to.be.false;
        expect(result.status).to.equal(400);
        expect(result.body.message).to.contain("Error updating folder");
        expect(result.body.errors[0]).to.deep.contain("Yeeet!");
      });
    });
  });

  describe("deleteFolder", () => {
    beforeEach(() => {
      mockFolderRepo.reset();
    });

    it("should delete an inactive, top-level folder, that has no children", async () => {
      const doc = mockFolderRepo.stubs.readOneFolder(mockFolderRepo.constants.externalTodoId, mockUserRepo.constants.adminUserId);
      doc.isActive = false;

      const result = await executeMiddlewareAsync({
          user: {...mockUserRepo.credentials.adminCreds},
          params: {id: doc._id}
        },
        foldersCtrl.deleteFolder
      );

      const { data } = result.body;
      expect(result.body.success).to.be.true;
      expect(result.status).to.equal(200);
      expect(data.count).to.equal(1);

      // Make sure it's really gone
      const doc2 = mockFolderRepo.stubs.readOneFolder(doc._id, mockUserRepo.constants.adminUserId);
      expect(!!doc2).to.be.false;
    });

    it("should delete an inactive, child folder", async () => {
      const doc = mockFolderRepo.stubs.readOneFolder(mockFolderRepo.constants.sprintTwoId, mockUserRepo.constants.adminUserId);
      doc.isActive = false;

      const result = await executeMiddlewareAsync({
          user: {...mockUserRepo.credentials.adminCreds},
          params: {id: doc._id}
        },
        foldersCtrl.deleteFolder
      );

      const { data } = result.body;
      expect(result.body.success).to.be.true;
      expect(result.status).to.equal(200);
      expect(data.count).to.equal(1);

      // Make sure it's really gone
      const doc2 = mockFolderRepo.stubs.readOneFolder(doc._id, mockUserRepo.constants.adminUserId);
      expect(!!doc2).to.be.false;

      // Make sure the parent knows
      const parentDoc = mockFolderRepo.stubs.readOneFolder(mockFolderRepo.constants.sprintsId, mockUserRepo.constants.adminUserId);
      expect(parentDoc.childrenIds).to.not.contain(doc._id);
    });

    it("should delete an inactive, parent folder and all all children", async () => {
      const doc = mockFolderRepo.stubs.readOneFolder(mockFolderRepo.constants.sprintsId, mockUserRepo.constants.adminUserId);
      doc.isActive = false;

      const result = await executeMiddlewareAsync({
          user: {...mockUserRepo.credentials.adminCreds},
          params: {id: doc._id}
        },
        foldersCtrl.deleteFolder
      );

      const { data } = result.body;
      expect(result.body.success).to.be.true;
      expect(result.status).to.equal(200);
      expect(data.count).to.equal(3);

      // Make sure it's really gone
      let doc2 = mockFolderRepo.stubs.readOneFolder(mockFolderRepo.constants.sprintsId, mockUserRepo.constants.adminUserId);
      expect(!!doc2).to.be.false;
      doc2 = mockFolderRepo.stubs.readOneFolder(mockFolderRepo.constants.sprintOneId, mockUserRepo.constants.adminUserId);
      expect(!!doc2).to.be.false;
      doc2 = mockFolderRepo.stubs.readOneFolder(mockFolderRepo.constants.sprintTwoId, mockUserRepo.constants.adminUserId);
      expect(!!doc2).to.be.false;
    });

    it("should not delete a folder that belongs to another user", async () => {
      const result = await executeMiddlewareAsync({
          user: {...mockUserRepo.credentials.adminCreds},
          params: {id: mockFolderRepo.constants.myProjectsId}
        },
        foldersCtrl.deleteFolder
      );

      expect(result.body.success).to.be.false;
      expect(result.status).to.equal(404);
      expect(result.body.message).to.contain("Unable to find folder");
    });

    it("should not delete a folder that does not exist", async () => {
      const result = await executeMiddlewareAsync({
          user: {...mockUserRepo.credentials.adminCreds},
          params: {id: "beefbeefbeefbeefbeefbeef"}
        },
        foldersCtrl.deleteFolder
      );

      expect(result.body.success).to.be.false;
      expect(result.status).to.equal(404);
      expect(result.body.message).to.contain("Unable to find folder");
    });

    it("should not delete a folder that is not marked inactive", async () => {
      const result = await executeMiddlewareAsync({
          user: {...mockUserRepo.credentials.adminCreds},
          params: {id: mockFolderRepo.constants.externalTodoId}
        },
        foldersCtrl.deleteFolder
      );

      const { success, message, errors } = result.body;
      expect(success).to.be.false;
      expect(result.status).to.equal(400);
      expect(message).to.equal("Error deleting folder");
      expect(errors).to.deep.equal(["Cannot delete a folder unless it is marked as inactive"]);
    });

    describe("error handling", () => {
      it("should return a 400 if there is an error unlinking from parent", async () => {
        const doc = mockFolderRepo.stubs.readOneFolder(mockFolderRepo.constants.externalTodoId, mockUserRepo.constants.adminUserId);
        doc.isActive = false;
    
        unlinkFromParentStub = sinon
          .stub(folderModel.folderRepository, "unlinkFromParent")
          .throws(new Error("Yeeet!"));
    
        const result = await executeMiddlewareAsync({
            user: {...mockUserRepo.credentials.adminCreds},
            params: {id: doc._id}
          },
          foldersCtrl.deleteFolder
        );
    
        const { success, message, errors } = result.body;
        expect(success).to.be.false;
        expect(result.status).to.equal(400);
        expect(message).to.equal("Error deleting folder");
        expect(errors).to.deep.equal(["Yeeet!"]);
      });
    });
  });
});


