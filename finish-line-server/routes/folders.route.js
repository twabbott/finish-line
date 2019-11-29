const foldersCtrl = require("../controllers/folders.ctrl");
const auth = require("../middleware/auth");

module.exports.init = function(router) {
  // Get all folders:
  //   GET .../v1/folders
  router.get("/v1/folders", auth.validateToken, foldersCtrl.readAllFolders);

  // Get specific folder
  //   GET .../v1/folders/:id
  router.get("/v1/folders/:id", auth.validateToken, foldersCtrl.readFolder);

  // Get contents for a folder
  //   GET .../v1/folders/:id/contents
  //     * Gets display info for all subfolders and projects
  //*** router.get("/v1/folders/:id/contents", foldersCtrl.readFolderContents);

  // Create a root folder:
  //   POST .../v1/folders
  router.post("/v1/folders", auth.validateToken, foldersCtrl.createFolder);

  // Modify (rename) a folder
  //   PUT .../v1/folders/:id
  //     * You can only change the folder's name.  No other props are recognized.
  router.put("/v1/folders/:id", auth.validateToken, foldersCtrl.updateFolder);

  // Delete a folder 
  //   DELETE .../v1/folders/:id
  //     * Don't allow deleting a folder that contains projects.  Require the user
  //       to manually delete or remove all projects.
  //     * This should manage de-coupling from the parent.
  router.delete("/v1/folders/:id", auth.validateToken, foldersCtrl.deleteFolder);
};
