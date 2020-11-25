const { createProject, readManyProjects, readOneProject, errorMessages } = require("../services/project.service");
const { createMap } = require("../middleware/automapper");
const { serviceWrapper, getResponse, postResponse, putResponse, deleteResponse } = require("../middleware/restFactory");
const { validateRequestBody, handleMongoErrors } = require("../middleware/errorHandlers");

const cleanup = createMap([
  ["_id", "id"],
  "name",
  "links",
  "status",
  "dueDate",
  "parentFolderIds",
  "todo",
  "userId",
  "isActive",
  "createdAt", 
  "createdBy", 
  "updatedAt", 
  "updatedBy", 
]);

const projectInfoSchema = {
  name: { 
    type: String, 
    required: true,
    maxLength: 200
  },
  links: { 
    type: Array,
    ofType: Object,
    schema: {
      url: { type: String, required: true, maxLength: 200 },
      text: { type: String, required: false, maxLength: 200, default: null }
    }
  },
  status: {
    type: String,
    required: false,
    values: ["Active", "Blocked", "On Hold", "Completed"],
    default: "Active",
    maxLength: 15
  },
  dueDate: {
    type: Date,
    required: false,
    default: null
  },
  parentFolderIds: {
    type: Array,
    ofType: String,
    minLength: 1,
    required: true
  },
  todo: {
    type: Array,
    ofType: Object,
    schema: {
      title: { type: String, required: true, maxLength: 200 },
      status: {
        type: String,
        required: true,
        values: ["Active", "Blocked", "On Hold", "Completed"],
        maxLength: 200
      },
      details: { type: String, required: true, maxLength: 200 },
      dueDate: { type: Date, required: false, default: null }
    }
  },
  isActive: { 
    type: Boolean,
    required: false, 
    default: true
  },
};

const validateProjectInfo = validateRequestBody(projectInfoSchema);

module.exports = {
  getManyProjects: [
    serviceWrapper.callAsync(readManyProjects),
    handleMongoErrors(errorMessages.read),
    cleanup.mapArray,
    getResponse
  ],

  getOneProject: [
    serviceWrapper.callAsync(readOneProject),
    handleMongoErrors(errorMessages.read),
    cleanup.mapScalar,
    getResponse
  ],

  postProject: [
    validateProjectInfo,
    serviceWrapper.callAsync(createProject),
    handleMongoErrors(errorMessages.create),
    cleanup.mapScalar,
    postResponse
  ]
};

