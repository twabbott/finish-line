const { expect } = require("chai");
const sinon = require("sinon");

// Dependencies
const { executeMiddleware, executeMiddlewareAsync, trace } = require("../test-utils/express-shim");
const { projectRepository } = require("../../models/project.model");
const { folderRepository } = require("../../models/folder.model");
const mockDb = require("../mockRepositories/mock-db");
const userSeed = require("../mockRepositories/user.seed");
const folderSeed = require("../mockRepositories/folder.seed");
const projectSeed = require("../mockRepositories/project.seed");
const regex = require("../../shared/regex");
const restFactory = require("../../middleware/restFactory");

// Module under test
const projectsCtrl = require("../../controllers/projects.ctrl");
const projectService = require("../../services/project.service");

describe.only("projects.ctrl", () => {
  let createProjectStub = null;
  let linkToParentStub = null;
  let unlinkFromParentStub = null;

  //restFactory.init({ errorLogger: err => console.log(err), traceOn: true });

  before(async () => {
    await mockDb.initialize();
    await userSeed.resetAll();
    await folderSeed.resetAll(userSeed.keys);
  });

  beforeEach(async () => {
    await projectSeed.resetAll(userSeed.keys, folderSeed.keys);
  });

  afterEach(() => {
    if (createProjectStub) {
      createProjectStub.restore();
    }
    createProjectStub = null;

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

  const mockNewProject = {
    name: "New project",
    links: [],
    status: "Active",
    todo: [
      { title: "Get it done", status: "Active", details: "This is my day.", dueDate: null },
    ],
    isActive: true
  };

  function deepCompare(actual, expected) {
    const actualCopy = JSON.parse(JSON.stringify(actual));
    const expectedCopy = JSON.parse(JSON.stringify(expected));

    expect(actualCopy).to.deep.equal(expectedCopy);
  }

  describe("getManyProjects", () => {
    it("should read all folders for a given project", async () => {
      const result = await executeMiddlewareAsync({
          user: {...userSeed.credentials.adminCreds},
          params: {
            folderId: folderSeed.keys.sprintOneId.toString(),
            ids: `${projectSeed.keys.someFeatureId},${projectSeed.keys.anotherFeatureId}`
          }
        },
        projectsCtrl.getManyProjects
      );

      expect(result.body.success).to.be.true;
      expect(result.status).to.equal(200);
      expect(result.body.data[0].name).to.equal("Make the cool feature");
      expect(result.body.data[1].name).to.equal("Here's another one");
    });
  });

  describe("getOneProject", () => {
    it("should read all folders for a given project", async () => {
      const result = await executeMiddlewareAsync({
          user: {...userSeed.credentials.adminCreds},
          params: {
            projectId: projectSeed.keys.someFeatureId.toString()
          }
        },
        projectsCtrl.getOneProject
      );

      expect(result.body.success).to.be.true;
      expect(result.status).to.equal(200);
      expect(result.body.data.name).to.equal("Make the cool feature");
    });
  });

  describe("postProject", () => {
    it("should create a new project", async () => {
      const result = await executeMiddlewareAsync({
          user: {...userSeed.credentials.adminCreds},
          params: {
            ids: `${projectSeed.keys.someFeatureId},${projectSeed.keys.anotherFeatureId}`
          },
          body: {
            ...mockNewProject,
            parentFolderIds: [folderSeed.keys.externalTodoId.toString()]
          }
        },
        projectsCtrl.postProject
      );

      expect(result.body.success).to.be.true;
      expect(result.status).to.equal(201);
      expect(result.body.data.name).to.equal(mockNewProject.name);

      const newPrj = await projectRepository.readOneProject(userSeed.keys.adminUserId, result.body.data.id);
      expect(newPrj).to.be.ok;
      expect(newPrj.name).to.equal(mockNewProject.name);

      const all = await folderRepository.readAllFolders(userSeed.keys.adminUserId);

      const parentFolder = await folderRepository.readOneFolder(folderSeed.keys.externalTodoId, userSeed.keys.adminUserId);
      expect(parentFolder).to.be.ok;

      expect(parentFolder.projectIds[0].toString()).to.equal(result.body.data.id.toString());
    });

    it("should not create a new project if there are no parent folders", async () => {
      const result = await executeMiddlewareAsync({
          user: {...userSeed.credentials.adminCreds},
          params: {
            ids: `${projectSeed.keys.someFeatureId},${projectSeed.keys.anotherFeatureId}`
          },
          body: {
            ...mockNewProject,
            parentFolderIds: []
          }
        },
        projectsCtrl.postProject
      );

      expect(result.body.success).to.be.false;
      expect(result.status).to.equal(400);
      expect(result.body.errors).to.deep.equal([
        {
          property: "parentFolderIds",
          message: "must have at least 1 elments"
        }
      ]);
    });

    it("should not create a new project if parent folder does not exist", async () => {
      const result = await executeMiddlewareAsync({
          user: {...userSeed.credentials.adminCreds},
          params: {
            ids: `${projectSeed.keys.someFeatureId},${projectSeed.keys.anotherFeatureId}`
          },
          body: {
            ...mockNewProject,
            parentFolderIds: ["beefbeefbeefbeefbeefbeef"]
          }
        },
        projectsCtrl.postProject
      );

      expect(result.body.success).to.be.false;
      expect(result.status).to.equal(400);
      expect(result.body.errors).to.deep.equal([
        "Error linking to parent folder id=beefbeefbeefbeefbeefbeef.  No such folder exists."
      ]);
    });

    it("should not create a new project and clean up after itself if parent folder does not exist", async () => {
      const parentFolderBefore = await folderRepository.readOneFolder(folderSeed.keys.externalTodoId, userSeed.keys.adminUserId);
      const existingProjects = [...parentFolderBefore.projectIds];

      const result = await executeMiddlewareAsync({
          user: {...userSeed.credentials.adminCreds},
          params: {
            ids: `${projectSeed.keys.someFeatureId},${projectSeed.keys.anotherFeatureId}`
          },
          body: {
            ...mockNewProject,
            parentFolderIds: [
              folderSeed.keys.externalTodoId.toString(),
              "beefbeefbeefbeefbeefbeef"
            ]
          }
        },
        projectsCtrl.postProject
      );

      expect(result.body.success).to.be.false;
      expect(result.status).to.equal(400);
      expect(result.body.errors).to.deep.equal([
        "Error linking to parent folder id=beefbeefbeefbeefbeefbeef.  No such folder exists."
      ]);

      const parentFolderAfter = await folderRepository.readOneFolder(folderSeed.keys.externalTodoId, userSeed.keys.adminUserId);
      expect(parentFolderAfter).to.be.ok;
      deepCompare(parentFolderAfter.projectIds, existingProjects);
    });

    describe("validation", () => {
      it("should reject for missing required parameters", async () => {
        const result = await executeMiddlewareAsync({
            user: {...userSeed.credentials.adminCreds},
            params: {
              ids: `${projectSeed.keys.someFeatureId},${projectSeed.keys.anotherFeatureId}`
            },
            body: {
            }
          },
          projectsCtrl.postProject
        );

        expect(result.body.success).to.be.false;
        expect(result.status).to.equal(400);
        expect(result.body.errors).to.deep.equal([
          { message: "is required", property: "name" },
          { message: "is required", property: "parentFolderIds"}
        ]);
      })
    })
  });
});




function doMath(x, y, operation) {
  // Do other needful stuff

  // Now return the result
  return operation(x, y);
}



let data = [
  { id: 1000, name: 'Alice', age: 25 },
  { id: 1001, name: 'Zoe', age: 7 },
  { id: 1002, name: 'Steve' age: 42 }

  // And so on...
];

function compare(left, right) {
  return (left === right && 0) || (left < right && -1) || (left > right && 1);
}

data.sort(compare);

