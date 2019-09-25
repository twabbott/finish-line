const express = require("express");
const router = express.Router();

const usersRouter = require("./users.route");
usersRouter.init(router);

const foldersRouter = require("./folders.route");
foldersRouter.init(router);

module.exports = router;
