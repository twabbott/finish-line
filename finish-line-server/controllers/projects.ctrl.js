const {
  makeGetMany,
  makeGetOne,
  makePost,
  makePut,
  makeDelete,
  autoMapper
} = require("./controllerFactory");

const projectsService = require("../services/project.service");

const mapper = {
  allDetails: autoMapper({
    id: "_id",
    name: true,
    links: true,
    order: true,
    status: true,
    dueDate: true,
    todo: true,
    parentIds: true,
    userId: true,
    isActive: true,
    createdAt: true,
    createdBy: true,
    updatedAt: true,
    updatedBy: true
  }),
  linkItem: autoMapper({
    url: true,
    text: true,
    groupName: true
  }),
  todoItem: autoMapper({
    title: true,
    status: true,
    details: true,
    dueDate: true
  })
};

const createProject = makePost(async (params, body, credentials) => {
  const project = await projectsService.create(
    body.name,
    body.links,
    body.order,
    body.status,
    body.dueDate,
    body.todo,
    body.parentIds,
    credentials.userId
  );

  return mapper.allDetails(project);
});

const readAllProjects = makeGetMany(async (params, credentials) => {
  const projects = await projectsService.readMany(params.parentId, credentials.userId);

  return projects.map(project => mapper.allDetails(project));
});

const readProject = makeGetOne(async (params, credentials) => {
  const project = await projectsService.readOne(params.id, credentials.userId);

  return mapper.allDetails(project);
});

const updateProject = makePut(async (params, body, credentials) => {
  let links = [];
  if (body.links && Array.isArray(body.links)) {
    links = body.links.map(link=>mapper.linkItem(link));
  }

  let todos = [];
  if (body.todos && Array.isArray(body.todos)) {
    todos = body.todos.map(todo => mapper.todoItem(todo));
  }

  const project = await projectsService.update(
    body.name,
    links,
    body.order,
    body.status,
    body.dueDate,
    todos,
    body.parentIds,
    credentials.userId
  );

  return mapper.allDetails(project);
});

const deleteProject = makeDelete(async (params, credentials) => {
  return await projectsService.delete(params.id, credentials.userId);
});

module.exports = {
  createProject,
  readAllProjects,
  readProject,
  updateProject,
  deleteProject
};
