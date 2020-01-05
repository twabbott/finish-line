const express = require("express");
const router = express.Router();

const signin = require("../controllers/auth.ctrl");

router.post("/auth/signin", signin);

module.exports = router;
