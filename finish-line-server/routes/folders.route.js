const foldersCtrl = require("../controllers/folders.ctrl");
const auth = require("../middleware/auth");

module.exports.init = function(router) {
  // Get all folders:
  //   GET .../v1/folders
  router.get("/v1/folders", auth.validateToken, foldersCtrl.readAllItems);

  // Get specific folder
  //   GET .../v1/folders/:id
  router.get("/v1/folders/:id", foldersCtrl.readItem);

  // Get contents for a folder
  //   GET .../v1/folders/:id/contents
  //     * Gets display info for all subfolders and projects
  //*** router.get("/v1/folders/:id/contents", foldersCtrl.readItemContents);

  // Create a root folder:
  //   POST .../v1/folders
  router.post("/v1/folders", foldersCtrl.createRootItem);

  // Create a subfolder
  //   POST .../v1/folders/:parentId/subfolders
  //*** router.post("/v1/folders/:parentId/subfolders", foldersCtrl.createSubitem);

  // Modify (rename) a folder
  //   PUT .../v1/folders/:id
  //     * You can only change the folder's name.  No other props are recognized.
  router.put("/v1/folders/:id", foldersCtrl.updateItem);

  // Delete a folder 
  //   DELETE .../v1/folders/:id
  //     * Don't allow deleting a folder that contains projects.  Require the user
  //       to manually delete or remove all projects.
  //     * This should manage de-coupling from the parent.
  router.delete("/v1/folders/:id", foldersCtrl.deleteItem);

  // Move a folder
  //   POST .../v1/folders/:id/parent/:newParentId
  //   POST .../v1/folders/:id/parent/root
  //*** router.post("/v1/folders/:id/parent/:newParentId", foldersCtrl.moveItem);
  //*** router.post("/v1/folders/:id/parent/root", foldersCtrl.moveItem);
};
