/* eslint-disable no-unused-vars, indent */

const { expect } = require("chai");
const sinon = require("sinon");

// Dependencies
const { executeMiddleware, executeMiddlewareAsync, trace } = require("../test-utils/express-shim");
const { folderRepository } = require("../../models/folder.model");
const mockDb = require("../mockRepositories/mock-db");
const userSeed = require("../mockRepositories/user.seed");
const folderSeed = require("../mockRepositories/folder.seed");
const regex = require("../../shared/regex");

// Module under test
const foldersCtrl = require("../../controllers/folders.ctrl");
const folderService = require("../../services/folder.service");

describe("folders.ctrl", () => {
  let createFolderStub = null;
  let linkToParentStub = null;
  let unlinkFromParentStub = null;

  before(async () => {
    await mockDb.initialize();
    await userSeed.resetAll();
  });

  beforeEach(async () => {
    await folderSeed.resetAll(userSeed.keys);
  });

  afterEach(() => {
    if (createFolderStub) {
      createFolderStub.restore();
    }
    createFolderStub = null;

    if (linkToParentStub) {
      linkToParentStub.restore();
    }
    linkToParentStub = null;

    if (unlinkFromParentStub) {
      unlinkFromParentStub.restore();
    }
    unlinkFromParentStub = null;
  });

  after(async () => {
    await mockDb.finalize();
  });

  const mockNewFolder = {
    name: "New Folder",
    parentId: null,
    isActive: true
  };

  describe("getAllFolders", () => {
    it("should read all folders belonging to user 1", async () => {
      const result = await executeMiddlewareAsync({
          user: {...userSeed.credentials.adminCreds},
        },
        foldersCtrl.getAllFolders
      );

      expect(result.body.success).to.be.true;
      expect(result.status).to.equal(200);
      expect(result.body.data).to.deep.equal([
        {
          "id": folderSeed.keys.externalTodoId,
          "name": "External TODO",
          "parentId": null,
          "projectIds": [],
          "isActive": true,
          "children": []
        },
        {
          "id": folderSeed.keys.sprintsId,
          "name": "Sprints",
          "parentId": null,
          "projectIds": [],
          "isActive": true,
          "children": [
            {
              "id": folderSeed.keys.sprintOneId,
              "name": "Q4 Sprint 3 (3.53) – October 30, 2019",
              "parentId": folderSeed.keys.sprintsId,
              "projectIds": [],
              "isActive": true,
              "children": []
            },
            {
              "id": folderSeed.keys.sprintTwoId,
              "name": "Q4 Sprint 4 (3.54) – November 13, 2019",
              "parentId": folderSeed.keys.sprintsId,
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
          user: {...userSeed.credentials.normalCreds},
        },
        foldersCtrl.getAllFolders
      );

      expect(result.body.success).to.be.true;
      expect(result.status).to.equal(200);
      expect(result.body.data).to.deep.equal([
        {
          "id": folderSeed.keys.myProjectsId,
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
          user: {...userSeed.credentials.adminCreds},
          params: { id: folderSeed.keys.sprintsId }
        },
        foldersCtrl.getOneFolder
      );

      expect(result.body.success).to.be.true;
      expect(result.status).to.equal(200);
      expect(result.body.data).to.deep.include({
        id: folderSeed.keys.sprintsId,
        name: "Sprints",
        parentId: null,
        projectIds: [],
        isActive: true,
        childrenIds: [
          folderSeed.keys.sprintOneId,
          folderSeed.keys.sprintTwoId
        ],
        userId: userSeed.keys.adminUserId,
        createdBy: userSeed.keys.adminUserId,
        updatedBy: userSeed.keys.adminUserId,
      });
    });

    it("should read one folder by folderId for user2", async () => {
      const result = await executeMiddlewareAsync({
          user: {...userSeed.credentials.normalCreds},
          params: { id: folderSeed.keys.myProjectsId }
        },
        foldersCtrl.getOneFolder
      );

      expect(result.body.success).to.be.true;
      expect(result.status).to.equal(200);
      expect(result.body.data).to.deep.include({
        id: folderSeed.keys.myProjectsId,
        parentId: null,
        childrenIds: [],
        projectIds: [],
        name: "My Projects",
        userId: userSeed.keys.normalUserId,
        createdBy: userSeed.keys.normalUserId,
        updatedBy: userSeed.keys.normalUserId,
        isActive: true
      });
    });

    it("should return a 404 for a folder that exists, but does not belong to the user", async () => {
      const result = await executeMiddlewareAsync({
          user: {...userSeed.credentials.adminCreds},
          params: { id: folderSeed.keys.myProjectsId }
        },
        foldersCtrl.getOneFolder
      );
  
      expect(result.body.success).to.be.false;
      expect(result.status).to.equal(404);
    });

    it("should return a 404 for a folder that does not exist", async () => {
      const result = await executeMiddlewareAsync({
          user: {...userSeed.credentials.adminCreds},
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
          user: {...userSeed.credentials.adminCreds},
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
      expect(data.userId).to.equal(userSeed.keys.adminUserId);
      expect(data.createdBy).to.equal(userSeed.keys.adminUserId);
      expect(data.updatedBy).to.equal(userSeed.keys.adminUserId);
      expect(isNaN(Date.parse(data.createdAt))).to.be.false;
      expect(isNaN(Date.parse(data.updatedAt))).to.be.false;
    });

    it("should create a new child folder", async () => {
      const result = await executeMiddlewareAsync({
          user: {...userSeed.credentials.adminCreds},
          body: {
            ...mockNewFolder, 
            parentId: folderSeed.keys.sprintsId.toString()
          }
        },
        foldersCtrl.postFolder
      );

      const { data } = result.body;
      expect(result.body.success).to.be.true;
      expect(result.status).to.equal(201);
      expect(regex.objectId.test(data.id)).to.be.true;
      expect(data.name).to.equal(mockNewFolder.name);
      expect(data.parentId).to.deep.equal(folderSeed.keys.sprintsId);
      expect(data.projectIds).to.deep.equal([]);
      expect(data.isActive).to.be.true;
      expect(data.childrenIds).to.deep.equal([]);
      expect(data.userId).to.equal(userSeed.keys.adminUserId);
      expect(data.createdBy).to.equal(userSeed.keys.adminUserId);
      expect(data.updatedBy).to.equal(userSeed.keys.adminUserId);
      expect(isNaN(Date.parse(data.createdAt))).to.be.false;
      expect(isNaN(Date.parse(data.updatedAt))).to.be.false;

      // Make sure that linkToParent did its thing
      const parentDoc = await folderRepository.readOneFolder(folderSeed.keys.sprintsId, userSeed.keys.adminUserId);
      expect(parentDoc.childrenIds).to.contain(data.id);
    });

    it("should fail validation for missing required parameters", async () => {
      const result = await executeMiddlewareAsync({
          user: {...userSeed.credentials.adminCreds},
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
          user: {...userSeed.credentials.adminCreds},
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
      expect(data.userId).to.equal(userSeed.keys.adminUserId);
      expect(data.createdBy).to.equal(userSeed.keys.adminUserId);
      expect(data.updatedBy).to.equal(userSeed.keys.adminUserId);
      expect(isNaN(Date.parse(data.createdAt))).to.be.false;
      expect(isNaN(Date.parse(data.updatedAt))).to.be.false;
    });

    describe("error handling", () => {
      it("should return 400 if repository throws an exception", async () => {
        createFolderStub = sinon
          .stub(folderRepository, "createFolder")
          .throws(new Error("foobar!"));
  
        const result = await executeMiddlewareAsync({
            user: {...userSeed.credentials.adminCreds},
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
            user: {...userSeed.credentials.adminCreds},
            body: {
              ...mockNewFolder,
              parentId: folderSeed.keys.myProjectsId.toString()
            }
          },
          foldersCtrl.postFolder
        );

        expect(result.body.success).to.be.false;
        expect(result.status).to.equal(400);
        expect(result.body.message).to.equal(folderService.errorMessages.create);
        expect(result.body.errors).to.deep.equal([
          `Folder with parentId=${folderSeed.keys.myProjectsId.toString()} not found.`
        ]);
      });
  
      it("should return 400 if you try to link to a parent that doesn't exist", async () => {
        const result = await executeMiddlewareAsync({
            user: {...userSeed.credentials.adminCreds},
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
          .stub(folderRepository, "linkToParent")
          .throws(new Error("Yeeet!"));

        const result = await executeMiddlewareAsync({
            user: {...userSeed.credentials.adminCreds},
            body: {
              ...mockNewFolder,
              parentId: folderSeed.keys.sprintsId.toString()
            }
          },
          foldersCtrl.postFolder
        );

        expect(result.body.success).to.be.false;
        expect(result.status).to.equal(400);
        expect(result.body.message).to.equal(folderService.errorMessages.create);
        expect(result.body.errors[0]).to.equal("Yeeet!");
      });
    });
  });

  describe("putFolder", () => {
    it("should update basic properties on an existing folder", async () => {
      const doc = await folderRepository.readOneFolder(folderSeed.keys.externalTodoId, userSeed.keys.adminUserId);
      doc.updatedby = "??";
      await doc.save();

      const result = await executeMiddlewareAsync({
          user: {...userSeed.credentials.adminCreds},
          params: {id: folderSeed.keys.externalTodoId},
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

      expect(data).to.deep.include({
        id: folderSeed.keys.externalTodoId,
        name: "New name",
        parentId: null,
        childrenIds: [],
        projectIds: [],
        userId: userSeed.keys.adminUserId,
        isActive: false,
        createdBy: userSeed.keys.adminUserId,
        updatedBy: userSeed.keys.adminUserId
      });
    });

    it("should move a top-level folder to a designated parent folder", async () => {
      const doc = await folderRepository.readOneFolder(
        folderSeed.keys.externalTodoId,
        userSeed.keys.adminUserId
      );

      const result = await executeMiddlewareAsync({
          user: {...userSeed.credentials.adminCreds},
          params: {id: doc._id},
          body: {
            name: doc.name,
            parentId: folderSeed.keys.sprintsId.toString()
          }
        },
        foldersCtrl.putFolder
      );

      const { data } = result.body;

      expect(result.body.success).to.be.true;
      expect(result.status).to.equal(200);
      expect(data).to.deep.include({
        id: doc._id,
        name: "External TODO",
        parentId: folderSeed.keys.sprintsId,
        childrenIds: [],
        projectIds: [],
        userId: userSeed.keys.adminUserId,
        isActive: true,
        createdBy: userSeed.keys.adminUserId,
        updatedBy: userSeed.keys.adminUserId
      });

      // Make sure the parent knows
      const parentDoc = await folderRepository.readOneFolder(folderSeed.keys.sprintsId, userSeed.keys.adminUserId);
      expect(parentDoc.childrenIds).to.contain(doc._id);
    });

    it("should move a child folder to the top level", async () => {
      const doc = await folderRepository.readOneFolder(
        folderSeed.keys.sprintTwoId,
        userSeed.keys.adminUserId
      );

      const result = await executeMiddlewareAsync({
          user: {...userSeed.credentials.adminCreds},
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
      expect(data).to.deep.include({
        id: doc._id,
        name: "Q4 Sprint 4 (3.54) – November 13, 2019",
        parentId: null,
        childrenIds: [],
        projectIds: [],
        userId: userSeed.keys.adminUserId,
        isActive: true,
        createdBy: userSeed.keys.adminUserId,
        updatedBy: userSeed.keys.adminUserId
      });

      // Make sure the parent knows
      const parentDoc = await folderRepository.readOneFolder(folderSeed.keys.sprintsId, userSeed.keys.adminUserId);
      expect(parentDoc.childrenIds).to.not.contain(doc._id);
    });

    it("should move a child folder to the top level", async () => {
      const doc = await folderRepository.readOneFolder(
        folderSeed.keys.sprintTwoId,
        userSeed.keys.adminUserId
      );

      const result = await executeMiddlewareAsync({
          user: {...userSeed.credentials.adminCreds},
          params: {id: doc._id},
          body: {
            name: doc.name,
            parentId: folderSeed.keys.sprintOneId.toString()
          }
        },
        foldersCtrl.putFolder
      );

      const { data } = result.body;

      expect(result.body.success).to.be.true;
      expect(result.status).to.equal(200);
      expect(data).to.deep.include({
        id: doc._id,
        name: "Q4 Sprint 4 (3.54) – November 13, 2019",
        parentId: folderSeed.keys.sprintOneId,
        childrenIds: [],
        projectIds: [],
        userId: userSeed.keys.adminUserId,
        isActive: true,
        createdBy: userSeed.keys.adminUserId,
        updatedBy: userSeed.keys.adminUserId
      });

      // Make sure the old parent knows
      const oldParentDoc = await folderRepository.readOneFolder(folderSeed.keys.sprintsId, userSeed.keys.adminUserId);
      expect(oldParentDoc.childrenIds).to.not.contain(doc._id);

      // Make sure the new parent knows
      const newParentDoc = await folderRepository.readOneFolder(folderSeed.keys.sprintOneId, userSeed.keys.adminUserId);
      expect(newParentDoc.childrenIds).to.contain(doc._id);
    });

    it("should return a 404 if you try to update a folder you don't own", async () => {
      const doc = await folderRepository.readOneFolder(
        folderSeed.keys.sprintTwoId,
        userSeed.keys.adminUserId
      );

      const result = await executeMiddlewareAsync({
          user: {...userSeed.credentials.normalCreds},
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
      const doc = await folderRepository.readOneFolder(
        folderSeed.keys.sprintTwoId,
        userSeed.keys.adminUserId
      );

      const result = await executeMiddlewareAsync({
          user: {...userSeed.credentials.normalCreds},
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
        const doc = await folderRepository.readOneFolder(
          folderSeed.keys.sprintTwoId,
          userSeed.keys.adminUserId
        );
    
        const result = await executeMiddlewareAsync({
            user: {...userSeed.credentials.adminCreds},
            params: {id: doc._id},
            body: {
              name: doc.name,
              parentId: doc._id.toString()
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
        const doc = await folderRepository.readOneFolder(
          folderSeed.keys.sprintTwoId,
          userSeed.keys.adminUserId
        );
    
        const result = await executeMiddlewareAsync({
            user: {...userSeed.credentials.adminCreds},
            params: {id: doc._id},
            body: {
              name: doc.name,
              parentId: folderSeed.keys.myProjectsId.toString()
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
        const doc = await folderRepository.readOneFolder(
          folderSeed.keys.sprintTwoId,
          userSeed.keys.adminUserId
        );
    
        const result = await executeMiddlewareAsync({
            user: {...userSeed.credentials.adminCreds},
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
          .stub(folderRepository, "linkToParent")
          .throws(new Error("Yeeet!"));

        const doc = await folderRepository.readOneFolder(
          folderSeed.keys.sprintTwoId,
          userSeed.keys.adminUserId
        );
  
        const result = await executeMiddlewareAsync({
            user: {...userSeed.credentials.adminCreds},
            params: {id: doc._id},
            body: {
              name: doc.name,
              parentId: folderSeed.keys.sprintOneId.toString()
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
    it("should delete an inactive, top-level folder, that has no children", async () => {
      const doc = await folderRepository.readOneFolder(
        folderSeed.keys.externalTodoId,
        userSeed.keys.adminUserId
      );
      doc.isActive = false;
      await doc.save();

      const result = await executeMiddlewareAsync({
          user: {...userSeed.credentials.adminCreds},
          params: {id: doc._id}
        },
        foldersCtrl.deleteFolder
      );

      const { data } = result.body;
      expect(result.body.success).to.be.true;
      expect(result.status).to.equal(200);
      expect(data.count).to.equal(1);

      // Make sure it's really gone
      const doc2 = await folderRepository.readOneFolder(doc._id, userSeed.keys.adminUserId);
      expect(!!doc2).to.be.false;
    });

    it("should delete an inactive, child folder", async () => {
      const doc = await folderRepository.readOneFolder(
        folderSeed.keys.sprintTwoId,
        userSeed.keys.adminUserId
      );
      doc.isActive = false;
      await doc.save();

      const result = await executeMiddlewareAsync({
          user: {...userSeed.credentials.adminCreds},
          params: {id: doc._id}
        },
        foldersCtrl.deleteFolder
      );

      const { data } = result.body;
      expect(result.body.success).to.be.true;
      expect(result.status).to.equal(200);
      expect(data.count).to.equal(1);

      // Make sure it's really gone
      const doc2 = await folderRepository.readOneFolder(doc._id, userSeed.keys.adminUserId);
      expect(!!doc2).to.be.false;

      // Make sure the parent knows
      const parentDoc = await folderRepository.readOneFolder(folderSeed.keys.sprintsId, userSeed.keys.adminUserId);
      expect(parentDoc.childrenIds).to.not.contain(doc._id);
    });

    it("should delete an inactive, parent folder and all all children", async () => {
      const doc = await folderRepository.readOneFolder(
        folderSeed.keys.sprintsId,
        userSeed.keys.adminUserId
      );
      doc.isActive = false;
      await doc.save();

      const result = await executeMiddlewareAsync({
          user: {...userSeed.credentials.adminCreds},
          params: {id: doc._id}
        },
        foldersCtrl.deleteFolder
      );

      const { data } = result.body;
      expect(result.body.success).to.be.true;
      expect(result.status).to.equal(200);
      expect(data.count).to.equal(3);

      // Make sure it's really gone
      let doc2 = await folderRepository.readOneFolder(folderSeed.keys.sprintsId, userSeed.keys.adminUserId);
      expect(!!doc2).to.be.false;
      doc2 = await folderRepository.readOneFolder(folderSeed.keys.sprintOneId, userSeed.keys.adminUserId);
      expect(!!doc2).to.be.false;
      doc2 = await folderRepository.readOneFolder(folderSeed.keys.sprintTwoId, userSeed.keys.adminUserId);
      expect(!!doc2).to.be.false;
    });

    it("should not delete a folder that belongs to another user", async () => {
      const result = await executeMiddlewareAsync({
          user: {...userSeed.credentials.adminCreds},
          params: {id: folderSeed.keys.myProjectsId}
        },
        foldersCtrl.deleteFolder
      );

      expect(result.body.success).to.be.false;
      expect(result.status).to.equal(404);
      expect(result.body.message).to.contain("Unable to find folder");
    });

    it("should not delete a folder that does not exist", async () => {
      const result = await executeMiddlewareAsync({
          user: {...userSeed.credentials.adminCreds},
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
          user: {...userSeed.credentials.adminCreds},
          params: {id: folderSeed.keys.externalTodoId}
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
        const doc = await folderRepository.readOneFolder(
          folderSeed.keys.sprintTwoId,
          userSeed.keys.adminUserId
        );
        doc.isActive = false;
        await doc.save();
    
        unlinkFromParentStub = sinon
          .stub(folderRepository, "unlinkFromParent")
          .throws(new Error("Yeeet!"));
    
        const result = await executeMiddlewareAsync({
            user: {...userSeed.credentials.adminCreds},
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


