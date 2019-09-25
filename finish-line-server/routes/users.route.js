const usersCtrl = require("../controllers/users.crtl");

module.exports.init = function(router) {
  router.post("/v1/users", usersCtrl.createUser);
  router.put("/v1/users/:id", usersCtrl.updateUser);
  router.delete("/v1/users/:id", usersCtrl.deleteUser);
  router.get("/v1/users/:id", usersCtrl.getUserById);
  router.get("/v1/users", usersCtrl.getUsers);
};
