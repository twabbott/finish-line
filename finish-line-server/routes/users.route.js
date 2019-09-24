const userCtrl = require("../controllers/users.crtl");

module.exports.init = function(router) {
  router.post("/users", userCtrl.createUser);
  router.put("/users/:id", userCtrl.updateUser);
  router.delete("/users/:id", userCtrl.deleteUser);
  router.get("/users/:id", userCtrl.getUserById);
  router.get("/users", userCtrl.getUsers);
};
