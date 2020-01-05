const logger = require("morgan");
const path = require("path");

const express = require("express");
const router = express.Router();

const restFactory = require("../middleware/restFactory");

const authRouter = require("./auth.route");
const foldersRouter = require("./folders.route");
//const projectsRouter = require("./projects.route");
const usersRouter = require("./users.route");

const { validateToken } = require("../middleware/auth");

function onError(err) {
  console.trace(err);
}

// Add all public routes
router.use(authRouter);

// All API routes
router.use(
  "/api", 
  logger("dev"),
  restFactory.init({ onError, traceOn: true }),
  validateToken, 
  foldersRouter, 
  //projectsRouter, 
  usersRouter
);

// All static routes
router.use(express.static(path.join(__dirname, "public")));

// Generic not-found router
router.use(function(req, res) {
  res.notFound();
});  

module.exports = router;