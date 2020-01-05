const express = require("express");
const router = express.Router();

const { createUser, updateUser, deleteUser, getUserById, getUsers } = require("../controllers/users.ctrl");
const { validateToken } = require("../middleware/auth");

// Require authorization
router.use(validateToken);

router.post("/v1/users", createUser);
router.put("/v1/users/:id", updateUser);
router.delete("/v1/users/:id", deleteUser);
//router.patch("/v1/users/:id", patchUser);
router.get("/v1/users/:id", getUserById);
router.get("/v1/users", getUsers);

module.exports = router;

