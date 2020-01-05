const express = require("express");
const router = express.Router();

const { createProject } = require("../controllers/projects.ctrl");
const { validateToken } = require("../middleware/auth");

// Require authorization
router.use(validateToken);

// Create a project:
//   POST .../v1/projects
router.post("/v1/folders", createProject);

module.exports = router;
