const express = require("express");
const router = express.Router();

const { signin } = require("../controllers/accounts.ctrl");
const { postUser } = require("../controllers/users.ctrl");

router.post("/accounts/signin", signin);
router.post("/accounts/users", postUser);

module.exports = router;
