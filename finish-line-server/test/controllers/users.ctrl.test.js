/* eslint-disable no-unused-vars, indent */

const { expect } = require("chai");

// Dependencies
const { executeMiddleware, executeMiddlewareAsync, trace } = require("../test-utils/express-shim");
const { userRepository } = require("../../models/user.model");
const mockDb = require("../mockRepositories/mock-db");
const usersSeed = require("../mockRepositories/users.seed");
const regex = require("../../shared/regex");

// Module under test
const usersCtrl = require("../../controllers/users.ctrl");

describe.only("users.ctrl", () => {
  before(async () => {
    await mockDb.initialize();    
  });

  beforeEach(async () => {
    await usersSeed.resetAll();
  });

  after(async () => {
    await mockDb.finalize();
  });

  const mockNewUser = Object.freeze({
    name: "Fred Flintstone",
    email: "fred.flintstone@hb.com",
    password: "1234",
    isAdmin: false,
    isActive: true
  });

  describe("getAllUsers", () => {
    describe("with admin credentials", async () => {
      it("should read all users", async () => {
        const result = await executeMiddlewareAsync({
            user: {...usersSeed.credentials.adminCreds},
          },
          usersCtrl.getAllUsers
        );

        expect(result.body.success).to.be.true;
        expect(result.status).to.equal(200);
        expect(Array.isArray(result.body.data)).to.be.true;
        expect(result.body.data.length).to.equal(2);
        expect(result.body.data[0].id).to.deep.equal(usersSeed.keys.adminUserId);
        expect(result.body.data[1].id).to.deep.equal(usersSeed.keys.normalUserId);
      });
    });

    describe("with normal credentials", () => {
      it("should read just the user's info.", async () => {
        const result = await executeMiddlewareAsync({
            user: {...usersSeed.credentials.normalCreds}
          },
          usersCtrl.getAllUsers
        );

        expect(result.body.success).to.be.true;
        expect(result.status).to.equal(200);
        expect(Array.isArray(result.body.data)).to.be.true;
        expect(result.body.data.length).to.equal(1);
        expect(result.body.data[0].id).to.deep.equal(usersSeed.keys.normalUserId);
      });
    });

    describe("with anonymous credentials", () => {
      it("should return 403.", async () => {
        const result = await executeMiddlewareAsync(
          {},
          usersCtrl.getAllUsers
        );

        expect(result.body.success).to.be.false;
        expect(result.status).to.equal(403);
        expect(result.body.message).to.equal("Forbidden");
      });
    });
  });

  describe("getOneUser", () => {
    describe("with admin credentials", () => {
      it("should read own user info", async () => {
        const result = await executeMiddlewareAsync({
            params: { id: usersSeed.keys.adminUserId },
            user: {...usersSeed.credentials.adminCreds}
          },
          usersCtrl.getOneUser
        );

        expect(result.body.success).to.be.true;
        expect(result.status).to.equal(200);
        expect(result.body.data.id).to.deep.equal(usersSeed.keys.adminUserId);
      });

      it("should read any other user's info", async () => {
        const result = await executeMiddlewareAsync({
            params: { id: usersSeed.keys.normalUserId },
            user: {...usersSeed.credentials.adminCreds}
          },
          usersCtrl.getOneUser
        );

        expect(result.body.success).to.be.true;
        expect(result.status).to.equal(200);
        expect(result.body.data.id).to.deep.equal(usersSeed.keys.normalUserId);
      });

      it("should return 404 if user is not found", async () => {
        const result = await executeMiddlewareAsync({
            params: { id: "111222333444555666777888" },
            user: {...usersSeed.credentials.adminCreds}
          },
          usersCtrl.getOneUser
        );

        expect(result.body.success).to.be.false;
        expect(result.status).to.equal(404);
      });
    });

    describe("with normal credentials", () => {
      it("should read own user info", async () => {
        const result = await executeMiddlewareAsync({
            params: { id: usersSeed.keys.normalUserId },
            user: {...usersSeed.credentials.normalCreds}
          },
          usersCtrl.getOneUser
        );

        expect(result.body.success).to.be.true;
        expect(result.status).to.equal(200);
        expect(result.body.data.id).to.deep.equal(usersSeed.keys.normalUserId);
      });

      it("should not be able to read another user's info", async () => {
        const result = await executeMiddlewareAsync(
          {
            params: { id: usersSeed.keys.adminUserId },
            user: {...usersSeed.credentials.normalCreds}
          },
          usersCtrl.getOneUser
        );

        expect(result.body.success).to.be.false;
        expect(result.status).to.equal(403);
        expect(result.body.message).to.equal("Forbidden");
      });
    });

    describe("with anonymous credentials", () => {
      it("should not be able to read any user's info", async () => {
        const result = await executeMiddlewareAsync(
          {
            params: { id: usersSeed.keys.normalUserId }
          },
          usersCtrl.getOneUser
        );

        expect(result.body.success).to.be.false;
        expect(result.status).to.equal(403);
        expect(result.body.message).to.equal("Forbidden");
      });
    });
  });

  describe("postUser", () => {
    describe("with admin credentials", () => {
      it("should allow creating a new user", async () => {
        const result = await executeMiddlewareAsync({
            user: {...usersSeed.credentials.adminCreds},
            body: {...mockNewUser}
          },
          usersCtrl.postUser
        );

        expect(result.body.success).to.be.true;
        expect(result.status).to.equal(201);
        expect(regex.objectId.test(result.body.data.id)).to.be.true;
        expect(result.body.data.name).to.equal("Fred Flintstone");
        expect(result.body.data.email).to.equal("fred.flintstone@hb.com");
        expect(result.body.data.isAdmin).to.equal(false);
        expect(result.body.data.isActive).to.equal(true);
        expect(isNaN(Date.parse(result.body.data.createdAt))).to.be.false;
        expect(isNaN(Date.parse(result.body.data.updatedAt))).to.be.false;
        expect(result.headers).to.deep.equal({ 
          Location: `http://blah.com//${result.body.data.id}` 
        });
      });
    });

    describe("with normal credentials", () => {
      it("should allow creating a new user", async () => {
        const result = await executeMiddlewareAsync({
            user: {...usersSeed.credentials.normalCreds},
            body: {...mockNewUser}
          },
          usersCtrl.postUser
        );

        expect(result.body.success).to.be.true;
        expect(result.status).to.equal(201);
        expect(regex.objectId.test(result.body.data.id)).to.be.true;
        expect(result.body.data.name).to.equal("Fred Flintstone");
        expect(result.body.data.email).to.equal("fred.flintstone@hb.com");
        expect(result.body.data.isAdmin).to.equal(false);
        expect(result.body.data.isActive).to.equal(true);
        expect(isNaN(Date.parse(result.body.data.createdAt))).to.be.false;
        expect(isNaN(Date.parse(result.body.data.updatedAt))).to.be.false;
        expect(result.headers).to.deep.equal({ 
          Location: `http://blah.com//${result.body.data.id}` 
        });
      });

      it("should not allow creating an admin user", async () => {
        const result = await executeMiddlewareAsync({
          user: {...usersSeed.credentials.normalCreds},
            body: {
              ...mockNewUser,
              isAdmin: true
            }
          },
          usersCtrl.postUser
        );

        expect(result.body.success).to.be.false;
        expect(result.status).to.equal(400);
        expect(result.body.errors).to.deep.equal([
          "Cannot create another admin user, unless you're currently signed in as an admin user."
        ]);
      });
    });

    describe("with anonymous credentials", () => {
      it("should allow creating a new user", async () => {
        const result = await executeMiddlewareAsync({
            body: {...mockNewUser}
          },
          usersCtrl.postUser
        );

        expect(result.body.success).to.be.true;
        expect(result.status).to.equal(201);
        expect(regex.objectId.test(result.body.data.id)).to.be.true;
        expect(result.body.data.name).to.equal("Fred Flintstone");
        expect(result.body.data.email).to.equal("fred.flintstone@hb.com");
        expect(result.body.data.isAdmin).to.equal(false);
        expect(result.body.data.isActive).to.equal(true);
        expect(isNaN(Date.parse(result.body.data.createdAt))).to.be.false;
        expect(isNaN(Date.parse(result.body.data.updatedAt))).to.be.false;
        expect(result.headers).to.deep.equal({ 
          Location: `http://blah.com//${result.body.data.id}` 
        });
      });

      it("should not allow creating an admin user", async () => {
        const result = await executeMiddlewareAsync({
          body: {
              ...mockNewUser,
              isAdmin: true
            }
          },
          usersCtrl.postUser
        );

        expect(result.body.success).to.be.false;
        expect(result.status).to.equal(400);
        expect(result.body.errors).to.deep.equal([
          "Cannot create another admin user, unless you're currently signed in as an admin user."
        ]);
      });
    });
  });

  describe("putUser", () => {
    describe("with admin credentials", () => {
      const newName = "John Doe";
      const newEmail = "john.doe@gmail.com";

      it("should allow updating a user's own info", async () => {
        const result = await executeMiddlewareAsync({
            params: { id: usersSeed.keys.adminUserId },
            user: {...usersSeed.credentials.adminCreds},
            body: {    
              name: newName,
              email: newEmail,
              isAdmin: false,
              isActive: false,
            }
          },
          usersCtrl.putUser
        );

        expect(result.body.success).to.be.true;
        expect(result.status).to.equal(200);
        expect(result.body.data.id).to.deep.equal(usersSeed.keys.adminUserId);
        expect(result.body.data.name).to.equal(newName);
        expect(result.body.data.email).to.equal(newEmail);
        expect(result.body.data.isAdmin).to.equal(false);
        expect(result.body.data.isActive).to.equal(false);
      });

      it("should allow updating another user's info", async () => {
        const result = await executeMiddlewareAsync({
            params: { id: usersSeed.keys.normalUserId },
            user: {...usersSeed.credentials.adminCreds},
            body: {    
              name: newName,
              email: newEmail,
              isAdmin: false,
              isActive: false,
            }
          },
          usersCtrl.putUser
        );

        expect(result.body.success).to.be.true;
        expect(result.status).to.equal(200);
        expect(result.body.data.id).to.deep.equal(usersSeed.keys.normalUserId);
        expect(result.body.data.name).to.equal(newName);
        expect(result.body.data.email).to.equal(newEmail);
        expect(result.body.data.isAdmin).to.equal(false);
        expect(result.body.data.isActive).to.equal(false);
      });

      it("should allow resetting another user's password", async () => {
        const result = await executeMiddlewareAsync({
            params: { id: usersSeed.keys.normalUserId },
            user: {...usersSeed.credentials.adminCreds},
            body: {    
              name: newName,
              email: newEmail,
              newPassword: "qa",
              isAdmin: false,
              isActive: false,
            }
          },
          usersCtrl.putUser
        );

        expect(result.body.success).to.be.true;
        expect(result.status).to.equal(200);
        expect(result.body.data.id).to.deep.equal(usersSeed.keys.normalUserId);
        expect(result.body.data.name).to.equal(newName);
        expect(result.body.data.email).to.equal(newEmail);
        expect(result.body.data.isAdmin).to.equal(false);
        expect(result.body.data.isActive).to.equal(false);
      });
    });

    describe("with normal credentials", () => {
      const newName = "John Doe";
      const newEmail = "john.doe@gmail.com";
  
      it("should allow updating a user's own info", async () => {
        const result = await executeMiddlewareAsync({
            params: { id: usersSeed.keys.normalUserId },
            user: {...usersSeed.credentials.normalCreds},
            body: {    
              name: newName,
              email: newEmail,
              password: usersSeed.credentials.password,
              isAdmin: false,
              isActive: false,
            }
          },
          usersCtrl.putUser
        );

        expect(result.body.success).to.be.true;
        expect(result.status).to.equal(200);
        expect(result.body.data.id).to.deep.equal(usersSeed.keys.normalUserId);
        expect(result.body.data.name).to.equal(newName);
        expect(result.body.data.email).to.equal(newEmail);
        expect(result.body.data.isAdmin).to.equal(false);
        expect(result.body.data.isActive).to.equal(false);
      });
  
      it("should allow resetting user's own password", async () => {
        const result = await executeMiddlewareAsync({
            params: { id: usersSeed.keys.normalUserId },
            user: {...usersSeed.credentials.normalCreds},
            body: {    
              name: newName,
              email: newEmail,
              newPassword: "blarggg",
              password: usersSeed.credentials.password,
              isAdmin: false,
              isActive: false,
            }
          },
          usersCtrl.putUser
        );

        expect(result.body.success).to.be.true;
        expect(result.status).to.equal(200);
        expect(result.body.data.id).to.deep.equal(usersSeed.keys.normalUserId);
        expect(result.body.data.name).to.equal(newName);
        expect(result.body.data.email).to.equal(newEmail);
        expect(result.body.data.isAdmin).to.equal(false);
        expect(result.body.data.isActive).to.equal(false);
      });
  
      it("should forbid user from promoting themselves to admin", async () => {
        const result = await executeMiddlewareAsync({
            params: { id: usersSeed.keys.normalUserId },
            user: {...usersSeed.credentials.normalCreds},
            body: {    
              name: newName,
              email: newEmail,
              password: usersSeed.credentials.password,
              isAdmin: true,
              isActive: false,
            }
          },
          usersCtrl.putUser
        );

        expect(result.body.success).to.be.false;
        expect(result.status).to.equal(400);
        expect(result.body.message).to.equal("Error updating user.");
        expect(result.body.errors).to.deep.equal(["You must be an admin in order to grant admin priveliges to any user."]);
      });
  
      it("should forbid updating user's own info if no password given", async () => {
        const result = await executeMiddlewareAsync({
            params: { id: usersSeed.keys.normalUserId },
            user: {...usersSeed.credentials.normalCreds},
            body: {    
              name: newName,
              email: newEmail,
              isAdmin: false,
              isActive: false,
            }
          },
          usersCtrl.putUser
        );

        expect(result.body.success).to.be.false;
        expect(result.status).to.equal(400);
        expect(result.body.message).to.equal("Error updating user.");
        expect(result.body.errors).to.deep.equal(["Property \"password\" must match current password."]);
      });

      it("should forbid updating user's own info if password does not match", async () => {
        const result = await executeMiddlewareAsync({
            params: { id: usersSeed.keys.normalUserId },
            user: {...usersSeed.credentials.normalCreds},
            body: {    
              name: newName,
              email: newEmail,
              password: "foobar",
              isAdmin: false,
              isActive: false,
            }
          },
          usersCtrl.putUser
        );

        expect(result.body.success).to.be.false;
        expect(result.status).to.equal(400);
        expect(result.body.message).to.equal("Error updating user.");
        expect(result.body.errors).to.deep.equal(["Property \"password\" must match current password."]);
      });

      it("should forbid updating another user's info", async () => {
        const result = await executeMiddlewareAsync({
            params: { id: usersSeed.keys.adminUserId },
            user: {...usersSeed.credentials.normalCreds},
            body: {    
              name: newName,
              email: newEmail,
              password: usersSeed.credentials.password,
              isAdmin: false,
              isActive: false,
            }
          },
          usersCtrl.putUser
        );

        expect(result.body.success).to.be.false;
        expect(result.status).to.equal(403);
        expect(result.body.message).to.equal("Forbidden");
      });
    });

    describe("with anonymous credentials", () => {
      const newName = "John Doe";
      const newEmail = "john.doe@gmail.com";

      it("should forbid updating any user's info", async () => {
        const result = await executeMiddlewareAsync({
            params: { id: usersSeed.keys.normalUserId },
            body: {    
              name: newName,
              email: newEmail,
              password: usersSeed.credentials.password,
              isAdmin: false,
              isActive: false,
            }
          },
          usersCtrl.putUser
        );

        expect(result.body.success).to.be.false;
        expect(result.status).to.equal(403);
        expect(result.body.message).to.equal("Forbidden");
      });
    });
  });

  describe("deleteUser", () => {
    describe("with admin credentials", () => {
      it("should allow deleting another deactivated user", async () => {
        const normie = await userRepository.readOneUser(usersSeed.keys.normalUserId);
        normie.isActive = false;
        await normie.save();

        const result = await executeMiddlewareAsync({
            params: { id: usersSeed.keys.normalUserId },
            user: {...usersSeed.credentials.adminCreds}
          },
          usersCtrl.deleteUser
        );

        expect(result.body.success).to.be.true;
        expect(result.status).to.equal(200);
        expect(result.body.data).to.deep.equal(
          { results: ["users: deleted 1 items."], totalCount: 1 }
        );
      });

      it("should not allow a user to delete theirself", async () => {
        const admin = await userRepository.readOneUser(usersSeed.keys.adminUserId);
        admin.isActive = false;
        await admin.save();

        const result = await executeMiddlewareAsync({
            params: { id: usersSeed.keys.adminUserId },
            user: {...usersSeed.credentials.adminCreds}
          },
          usersCtrl.deleteUser
        );

        expect(result.body.success).to.be.false;
        expect(result.status).to.equal(400);
        expect(result.body.errors).to.deep.equal([
          "You cannot delete yourself.  Use another user that has admin rights."
        ]);
      });

      it("should allow deleting a user that is not deactivated", async () => {
        const result = await executeMiddlewareAsync({
            params: { id: usersSeed.keys.normalUserId },
            user: {...usersSeed.credentials.adminCreds}
          },
          usersCtrl.deleteUser
        );

        expect(result.body.success).to.be.false;
        expect(result.status).to.equal(400);
        expect(result.body.errors).to.deep.equal([
          "Cannot delete a user that is marked as active."
        ]);
      });

      it("should return an error if you delete a user that does not exist", async () => {
        const result = await executeMiddlewareAsync({
            params: { id: "aaaabbbbccccddddeeeeffff" },
            user: {...usersSeed.credentials.adminCreds}
          },
          usersCtrl.deleteUser
        );

        expect(result.body.success).to.be.false;
        expect(result.status).to.equal(404);
        expect(result.body.message).to.equal("No records found for userId aaaabbbbccccddddeeeeffff");
      });
    });

    describe("with normal credentials", () => {
      it("should not allow a user to delete another user", async () => {
        const admin = await userRepository.readOneUser(usersSeed.keys.adminUserId);
        admin.isActive = false;
        await admin.save();

        const result = await executeMiddlewareAsync({
            params: { id: usersSeed.keys.adminUserId },
            user: {...usersSeed.credentials.normalCreds}
          },
          usersCtrl.deleteUser
        );

        expect(result.body.success).to.be.false;
        expect(result.status).to.equal(403);
        expect(result.body.message).to.equal("Forbidden");
      });
    });

    describe("with anonymous credentials", () => {
      it("should not allow anonymous user to delete any user", async () => {
        const admin = await userRepository.readOneUser(usersSeed.keys.adminUserId);
        admin.isActive = false;
        await admin.save();

        const result = await executeMiddlewareAsync({
            params: { id: usersSeed.keys.adminUserId },
          },
          usersCtrl.deleteUser
        );

        expect(result.body.success).to.be.false;
        expect(result.status).to.equal(403);
        expect(result.body.message).to.equal("Forbidden");
      });
    });
  });
});


// out of date admin token:
// Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiI1ZGNiMTdlOGQxMTQ4Njk1NDA4NjkzNzMiLCJuYW1lIjoiVG9tIEFiYm90dCIsImVtYWlsIjoidHdhYmJvdHRAb3V0bG9vay5jb20iLCJpc0FkbWluIjp0cnVlLCJpYXQiOjE1NzkxMTcwNzR9.mDt1P72VaePJskXwwvdYc1HLF_PDUJ8CI4RgnFKr62U

// out of date user token:
// 





