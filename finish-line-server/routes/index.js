const express = require("express");
const router = express.Router();

const authRouter = require("./auth.route");
authRouter.init(router);

const usersRouter = require("./users.route");
usersRouter.init(router);

const foldersRouter = require("./folders.route");
foldersRouter.init(router);

module.exports = router;
