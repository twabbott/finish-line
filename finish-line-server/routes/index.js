const logger = require("morgan");
const path = require("path");

const express = require("express");
const router = express.Router();

const accountsRouter = require("./accounts.route");
const foldersRouter = require("./folders.route");
//const projectsRouter = require("./projects.route");
const usersRouter = require("./users.route");

const { validateToken } = require("../middleware/auth");

// Repartee config
const { responses } = require("../middleware/repartee");
router.use(responses());

// restFactory config
const restFactory = require("../middleware/restFactory");
restFactory.init({
  errorLogger: err => console.trace(err),
  traceOn: true
});

// Add all public routes
router.use(accountsRouter);

// All API routes
router.use(
  "/api", 
  logger("dev"),
  validateToken, 
  foldersRouter, 
  //projectsRouter, 
  usersRouter
);

// All static routes
router.use(express.static(path.join(__dirname, "public")));

// Catch-all error handlers
router.use(
  function(req, res) {
    res.notFound();
  },
  restFactory.handleErrors
);  

module.exports = router;