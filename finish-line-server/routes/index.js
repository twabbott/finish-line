const logger = require('morgan');
const path = require('path');

const express = require('express');
const router = express.Router();

const authRouter = require("./auth.route");
const foldersRouter = require("./folders.route");
const projectsRouter = require("./projects.route");
const usersRouter = require("./users.route");

const { validateToken } = require("../middleware/auth");

// Add all public routes
router.use(authRouter);

// All API routes
router.use(
  "/api", 
  logger("dev"),
  validateToken, 
  foldersRouter, 
  projectsRouter, 
  usersRouter
);

// All static routes
router.use(express.static(path.join(__dirname, 'public')))

// Generic not-found router
router.use(function(req, res) {
  res.notFound();
});  

module.exports = router;