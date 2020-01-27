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

// Module under test
const projectsCtrl = require("../../controllers/projects.ctrl");
const projectService = require("../../services/project.service");

describe.only("projects.ctrl", () => {
  let createProjectStub = null;
  let linkToParentStub = null;
  let unlinkFromParentStub = null;

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

  describe("postProject", () => {
    it("should create a new project", async () => {
      const result = await executeMiddlewareAsync({
          user: {...userSeed.credentials.adminCreds},
          params: {
            folderId: folderSeed.keys.sprintOneId.toString(),
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
  });
});
