const foldersCtrl = require("../controllers/folders.ctrl");

module.exports.init = function(router) {
  router.get("/v1/folders/:id", foldersCtrl.getFolderById);
  router.get("/v1/folders", foldersCtrl.getFolders);
  router.post("/v1/folders", foldersCtrl.createFolder);
  //router.put("/v1/folders/:id", foldersCtrl.updateFolder);
  //router.delete("/v1/folders/:id", foldersCtrl.deleteFolder);
};
