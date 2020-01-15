const express = require("express");
const router = express.Router();

const { getAllUsers, getOneUser, postUser, putUser, deleteUser } = require("../controllers/users.ctrl");

router.get("/v1/users", getAllUsers);
router.get("/v1/users/:id", getOneUser);
router.post("/v1/users", postUser);
router.put("/v1/users/:id", putUser);
router.delete("/v1/users/:id", deleteUser);
//router.patch("/v1/users/:id", patchUser);

module.exports = router;

