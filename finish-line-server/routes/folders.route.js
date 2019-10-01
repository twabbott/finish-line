const foldersCtrl = require("../controllers/folders.ctrl");

module.exports.init = function(router) {
  router.get("/v1/folders", foldersCtrl.readAllItems);
  router.get("/v1/folders/:id", foldersCtrl.readItem);
  router.post("/v1/folders", foldersCtrl.createItem);
  router.put("/v1/folders/:id", foldersCtrl.updateItem);
  router.delete("/v1/folders/:id", foldersCtrl.deleteItem);
};
