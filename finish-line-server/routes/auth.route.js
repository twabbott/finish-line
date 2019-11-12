const authCtrl = require("../controllers/auth.ctrl");

module.exports.init = function(router) {
  router.post("/auth/signin", authCtrl.signin);
};
