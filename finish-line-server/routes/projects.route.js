const projectsCtrl = require("../controllers/projects.ctrl");
const auth = require("../middleware/auth");

module.exports.init = function(router) {


  // Create a project:
  //   POST .../v1/projects
  router.post("/v1/folders", auth.validateToken, projectsCtrl.createProject);
};