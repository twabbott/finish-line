const express = require("express");
const router = express.Router();

const usersRouter = require("./users.route");
usersRouter.init(router);

module.exports = router;
