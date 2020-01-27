const { folderRepository } = require("../../models/folder.model");
const { projectSchema, projectRepository } = require("../../models/project.model");

const keys = {
  someFeatureId: undefined,
  anotherFeatureId: undefined,
  myProject: undefined,
};

async function resetAll(userKeys, folderKeys) {
  await projectSchema.deleteMany();

  const someFeature = await projectRepository.createProject({
    name: "Make the cool feature",
    links: [
      { text: "Google", url: "https://www.google.com" },
      { text: "Reddit", url: "https://www.reddit.com" }
    ],
    status: "Active",
    dueDate: null,
    parentFolderIds: [folderKeys.sprintOneId],
    todo: [
      { title: "Procrastinate about it", status: "Active", details: "I'll get around to it.", dueDate: null },
      { title: "Overthink about it", status: "Active", details: "The pressure is on!", dueDate: null },
    ],
    userId: userKeys.adminUserId,
    isActive: true,
    createdBy: userKeys.adminUserId,
    updatedBy: userKeys.adminUserId
  });

  keys.someFeatureId = someFeature._id;

  const anotherFeature = await projectRepository.createProject({
    name: "Here's another one",
    links: [],
    status: "Active",
    dueDate: null,
    parentFolderIds: [folderKeys.sprintOneId],
    todo: [],
    userId: userKeys.adminUserId,
    isActive: true,
    createdBy: userKeys.adminUserId,
    updatedBy: userKeys.adminUserId
  });

  keys.anotherFeatureId = anotherFeature._id;

  const sprintOne = await folderRepository.readOneFolder(folderKeys.sprintOneId, userKeys.adminUserId);
  sprintOne.projectIds = [someFeature._id, anotherFeature._id];
  await sprintOne.save();

  const myProject = await projectRepository.createProject({
    name: "My project",
    links: [],
    status: "Active",
    dueDate: null,
    parentFolderIds: [folderKeys.myProjectsId],
    todo: [
      { title: "Get it done", status: "Active", details: "This is my day.", dueDate: null },
    ],
    userId: userKeys.normalUserId,
    isActive: true,
    createdBy: userKeys.normalUserId,
    updatedBy: userKeys.normalUserId
  });

  keys.myProject = myProject._id;

  const myProjects = await folderRepository.readOneFolder(folderKeys.myProjectsId, userKeys.normalUserId);
  myProjects.projectIds = [myProject._id];
  await myProjects.save();
}

module.exports = {
  keys,
  resetAll
};