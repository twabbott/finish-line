const usersCtrl = require("../controllers/users.ctrl");

module.exports.init = function(router) {
  router.post("/v1/users", usersCtrl.createUser);
  router.put("/v1/users/:id", usersCtrl.updateUser);
  router.delete("/v1/users/:id", usersCtrl.deleteUser);
  router.patch("/v1/users/:id", usersCtrl.patchUser);
  router.get("/v1/users/:id", usersCtrl.getUserById);
  router.get("/v1/users", usersCtrl.getUsers);
};
