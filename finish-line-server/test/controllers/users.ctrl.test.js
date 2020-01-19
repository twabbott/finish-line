/* eslint-disable no-unused-vars, indent */

const { expect, assert } = require("chai");

// Dependencies
const restFactory = require("../../middleware/restFactory");
const { executeMiddleware } = require("../test-utils/express-shim");
const mockUserRepo = require("../mockRepositories/users.model.mock");
const regex = require("../../shared/regex");

// Module under test
const usersCtrl = require("../../controllers/users.ctrl");

describe("users.ctrl", () => {
  before(() => {
    // restFactory.init({ 
    //   traceOn: true,
    //   errorLogger: err => console.trace(err) 
    // });

    mockUserRepo.initialize();
  });

  after(() => {
    mockUserRepo.finalize();
  });

  const adminCreds = {
    userId: mockUserRepo.constants.adminUserId,
    name: "Admin",
    email: "admin@foo.com",
    isAdmin: true
  };

  const normalCreds = {
    userId: mockUserRepo.constants.normalUserId,
    name: "Barney Fief",
    email: "barney@gmail.com",
    isAdmin: false
  };

  const mockNewUser = {
    name: "Fred Flintstone",
    email: "fred.flintstone@hb.com",
    password: "1234",
    isAdmin: false,
    isActive: true
  };

  function executeStack(mockReq, middleware, callback, timeout=100) {
    const result = executeMiddleware(mockReq, ...middleware);
    setTimeout(() => {
      callback(result);
    }, timeout);
  }

  describe("getAllUsers", () => {
    before(() => {
      mockUserRepo.reset();
    });

    describe("with admin credentials", () => {
      it("should read all users", (done) => {
        executeStack({
            user: {...adminCreds},
          },
          usersCtrl.getAllUsers,
          result => {
            expect(result.body.success).to.be.true;
            expect(result.status).to.equal(200);
            expect(Array.isArray(result.body.data)).to.be.true;
            expect(result.body.data.length).to.equal(2);
            expect(result.body.data[0].id).to.equal(mockUserRepo.constants.adminUserId);
            expect(result.body.data[1].id).to.equal(mockUserRepo.constants.normalUserId);
    
            done();
          }
        );
      });
    });

    describe("with normal credentials", () => {
      it("should read just the user's info.", (done) => {
        executeStack({
            user: {...normalCreds}
          },
          usersCtrl.getAllUsers,
          result => {
            expect(result.body.success).to.be.true;
            expect(result.status).to.equal(200);
            expect(Array.isArray(result.body.data)).to.be.true;
            expect(result.body.data.length).to.equal(1);
            expect(result.body.data[0].id).to.equal(mockUserRepo.constants.normalUserId);
    
            done();
          }
        );
      });
    });

    describe("with anonymous credentials", () => {
      it("should read just the user's info.", (done) => {
        executeStack(
          {},
          usersCtrl.getAllUsers,
          result => {
            expect(result.body.success).to.be.false;
            expect(result.status).to.equal(403);
            expect(result.body.message).to.equal("Forbidden");
    
            done();
          }
        );
      });
    });
  });

  describe("getOneUser", () => {
    before(() => {
      mockUserRepo.reset();
    });

    describe("with admin credentials", () => {
      it("should read own user info", (done) => {
        executeStack({
            params: { id: mockUserRepo.constants.adminUserId },
            user: {...adminCreds}
          },
          usersCtrl.getOneUser,
          result => {
            expect(result.body.success).to.be.true;
            expect(result.status).to.equal(200);
            expect(result.body.data.id).to.equal(mockUserRepo.constants.adminUserId);
    
            done();
          }
        );
      });

      it("should read any other user's info", (done) => {
        executeStack({
            params: { id: mockUserRepo.constants.normalUserId },
            user: {...adminCreds}
          },
          usersCtrl.getOneUser,
          result => {
            expect(result.body.success).to.be.true;
            expect(result.status).to.equal(200);
            expect(result.body.data.id).to.equal(mockUserRepo.constants.normalUserId);
    
            done();
          }
        );
      });
    });

    describe("with normal credentials", () => {
      it("should read own user info", (done) => {
        executeStack({
            params: { id: mockUserRepo.constants.normalUserId },
            user: {...normalCreds}
          },
          usersCtrl.getOneUser,
          result => {
            expect(result.body.success).to.be.true;
            expect(result.status).to.equal(200);
            expect(result.body.data.id).to.equal(mockUserRepo.constants.normalUserId);
    
            done();
          }
        );
      });

      it("should not be able to read another user's info", (done) => {
        executeStack(
          {
            params: { id: mockUserRepo.constants.adminUserId },
            user: {...normalCreds}
          },
          usersCtrl.getOneUser,
          result => {
            expect(result.body.success).to.be.false;
            expect(result.status).to.equal(403);
            expect(result.body.message).to.equal("Forbidden");
    
            done();
          }
        );
      });
    });

    describe("with anonymous credentials", () => {
      it("should not be able to read any user's info", (done) => {
        executeStack(
          {
            params: { id: mockUserRepo.constants.normalUserId }
          },
          usersCtrl.getOneUser,
          result => {
            expect(result.body.success).to.be.false;
            expect(result.status).to.equal(403);
            expect(result.body.message).to.equal("Forbidden");
    
            done();
          }
        );
      });
    });
  });

  describe("postUser", () => {
    before(() => {
      mockUserRepo.reset();
    });

    after(() => {
    });

    describe("with admin credentials", () => {
      it("should allow creating a new user", (done) => {
        executeStack({
            user: {...adminCreds},
            body: {...mockNewUser}
          },
          usersCtrl.postUser,
          result => {
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
    
            done();
          }
        );
      });
    });

    describe("with normal credentials", () => {
      it("should allow creating a new user", (done) => {
        executeStack({
            user: {...normalCreds},
            body: {...mockNewUser}
          },
          usersCtrl.postUser,
          result => {
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
    
            done();
          }
        );
      });

      it("should not allow creating an admin user", (done) => {
        executeStack({
          user: {...normalCreds},
            body: {
              ...mockNewUser,
              isAdmin: true
            }
          },
          usersCtrl.postUser,
          result => {
            expect(result.body.success).to.be.false;
            expect(result.status).to.equal(400);
            expect(result.body.errors).to.deep.equal([
              "Cannot create another admin user, unless you're currently signed in as an admin user."
            ]);
    
            done();
          }
        );
      });
    });

    describe("with anonymous credentials", () => {
      it("should allow creating a new user", (done) => {
        executeStack({
            body: {...mockNewUser}
          },
          usersCtrl.postUser,
          result => {
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
    
            done();
          }
        );
      });

      it("should not allow creating an admin user", (done) => {
        executeStack({
          body: {
              ...mockNewUser,
              isAdmin: true
            }
          },
          usersCtrl.postUser,
          result => {
            expect(result.body.success).to.be.false;
            expect(result.status).to.equal(400);
            expect(result.body.errors).to.deep.equal([
              "Cannot create another admin user, unless you're currently signed in as an admin user."
            ]);
    
            done();
          }
        );
      });
    });
  });

  describe("putUser", () => {
    beforeEach(() => {
      mockUserRepo.reset();
    });

    describe("with admin credentials", () => {
      const newName = "John Doe";
      const newEmail = "john.doe@gmail.com";

      it("should allow updating a user's own info", (done) => {
        executeStack({
            params: { id: mockUserRepo.constants.adminUserId },
            user: {...adminCreds},
            body: {    
              name: newName,
              email: newEmail,
              isAdmin: false,
              isActive: false,
            }
          },
          usersCtrl.putUser,
          result => {
            expect(result.body.success).to.be.true;
            expect(result.status).to.equal(200);
            expect(result.body.data.id).to.be.equal(mockUserRepo.constants.adminUserId);
            expect(result.body.data.name).to.equal(newName);
            expect(result.body.data.email).to.equal(newEmail);
            expect(result.body.data.isAdmin).to.equal(false);
            expect(result.body.data.isActive).to.equal(false);
    
            done();
          }
        );
      });

      it("should allow updating another user's info", (done) => {
        executeStack({
            params: { id: mockUserRepo.constants.normalUserId },
            user: {...adminCreds},
            body: {    
              name: newName,
              email: newEmail,
              isAdmin: false,
              isActive: false,
            }
          },
          usersCtrl.putUser,
          result => {
            expect(result.body.success).to.be.true;
            expect(result.status).to.equal(200);
            expect(result.body.data.id).to.be.equal(mockUserRepo.constants.normalUserId);
            expect(result.body.data.name).to.equal(newName);
            expect(result.body.data.email).to.equal(newEmail);
            expect(result.body.data.isAdmin).to.equal(false);
            expect(result.body.data.isActive).to.equal(false);
    
            done();
          }
        );
      });

      it("should allow resetting another user's password", (done) => {
        executeStack({
            params: { id: mockUserRepo.constants.normalUserId },
            user: {...adminCreds},
            body: {    
              name: newName,
              email: newEmail,
              newPassword: "qa",
              isAdmin: false,
              isActive: false,
            }
          },
          usersCtrl.putUser,
          result => {
            expect(result.body.success).to.be.true;
            expect(result.status).to.equal(200);
            expect(result.body.data.id).to.be.equal(mockUserRepo.constants.normalUserId);
            expect(result.body.data.name).to.equal(newName);
            expect(result.body.data.email).to.equal(newEmail);
            expect(result.body.data.isAdmin).to.equal(false);
            expect(result.body.data.isActive).to.equal(false);
    
            done();
          }
        );
      });
    });

    describe("with normal credentials", () => {
      const newName = "John Doe";
      const newEmail = "john.doe@gmail.com";
  
      it("should allow updating a user's own info", (done) => {
        executeStack({
            params: { id: mockUserRepo.constants.normalUserId },
            user: {...normalCreds},
            body: {    
              name: newName,
              email: newEmail,
              password: mockUserRepo.constants.password,
              isAdmin: false,
              isActive: false,
            }
          },
          usersCtrl.putUser,
          result => {
            expect(result.body.success).to.be.true;
            expect(result.status).to.equal(200);
            expect(result.body.data.id).to.be.equal(mockUserRepo.constants.normalUserId);
            expect(result.body.data.name).to.equal(newName);
            expect(result.body.data.email).to.equal(newEmail);
            expect(result.body.data.isAdmin).to.equal(false);
            expect(result.body.data.isActive).to.equal(false);
    
            done();
          }
        );
      });
  
      it("should allow resetting user's own password", (done) => {
        executeStack({
            params: { id: mockUserRepo.constants.normalUserId },
            user: {...normalCreds},
            body: {    
              name: newName,
              email: newEmail,
              newPassword: "blarggg",
              password: mockUserRepo.constants.password,
              isAdmin: false,
              isActive: false,
            }
          },
          usersCtrl.putUser,
          result => {
            expect(result.body.success).to.be.true;
            expect(result.status).to.equal(200);
            expect(result.body.data.id).to.be.equal(mockUserRepo.constants.normalUserId);
            expect(result.body.data.name).to.equal(newName);
            expect(result.body.data.email).to.equal(newEmail);
            expect(result.body.data.isAdmin).to.equal(false);
            expect(result.body.data.isActive).to.equal(false);
  
            done();
          }, 200
        );
      });
  
      it("should forbid user from promoting themselves to admin", (done) => {
        executeStack({
            params: { id: mockUserRepo.constants.normalUserId },
            user: {...normalCreds},
            body: {    
              name: newName,
              email: newEmail,
              password: mockUserRepo.constants.password,
              isAdmin: true,
              isActive: false,
            }
          },
          usersCtrl.putUser,
          result => {
            expect(result.body.success).to.be.false;
            expect(result.status).to.equal(400);
            expect(result.body.message).to.equal("Error updating user.");
            expect(result.body.errors).to.deep.equal(["You must be an admin in order to grant admin priveliges to any user."]);
  
            done();
          }
        );
      });
  
      it("should forbid updating user's own info if no password given", (done) => {
        executeStack({
            params: { id: mockUserRepo.constants.normalUserId },
            user: {...normalCreds},
            body: {    
              name: newName,
              email: newEmail,
              isAdmin: false,
              isActive: false,
            }
          },
          usersCtrl.putUser,
          result => {
            expect(result.body.success).to.be.false;
            expect(result.status).to.equal(400);
            expect(result.body.message).to.equal("Error updating user.");
            expect(result.body.errors).to.deep.equal(["Property \"password\" must match current password."]);
  
            done();
          }
        );
      });
  
      it("should forbid updating user's own info if password does not match", (done) => {
        executeStack({
            params: { id: mockUserRepo.constants.normalUserId },
            user: {...normalCreds},
            body: {    
              name: newName,
              email: newEmail,
              password: "foobar",
              isAdmin: false,
              isActive: false,
            }
          },
          usersCtrl.putUser,
          result => {
            expect(result.body.success).to.be.false;
            expect(result.status).to.equal(400);
            expect(result.body.message).to.equal("Error updating user.");
            expect(result.body.errors).to.deep.equal(["Property \"password\" must match current password."]);
  
            done();
          }
        );
      });
  
      it("should forbid updating another user's info", (done) => {
        executeStack({
            params: { id: mockUserRepo.constants.adminUserId },
            user: {...normalCreds},
            body: {    
              name: newName,
              email: newEmail,
              password: mockUserRepo.constants.password,
              isAdmin: false,
              isActive: false,
            }
          },
          usersCtrl.putUser,
          result => {
            expect(result.body.success).to.be.false;
            expect(result.status).to.equal(403);
            expect(result.body.message).to.equal("Forbidden");
  
            done();
          }
        );
      });
    });

    describe("with anonymous credentials", () => {
      const newName = "John Doe";
      const newEmail = "john.doe@gmail.com";

      it("should forbid updating any user's info", (done) => {
        executeStack({
            params: { id: mockUserRepo.constants.normalUserId },
            body: {    
              name: newName,
              email: newEmail,
              password: mockUserRepo.constants.password,
              isAdmin: false,
              isActive: false,
            }
          },
          usersCtrl.putUser,
          result => {
            expect(result.body.success).to.be.false;
            expect(result.status).to.equal(403);
            expect(result.body.message).to.equal("Forbidden");

            done();
          }
        );
      });
    });
  });

  describe("deleteUser", () => {
    beforeEach(() => {
      mockUserRepo.reset();
    });

    describe("with admin credentials", () => {
      it("should allow deleting another deactivated user", (done) => {
        const normie = mockUserRepo.stubs.readOneUser(mockUserRepo.constants.normalUserId);
        normie.isActive = false;
        normie.save();

        executeStack({
            params: { id: mockUserRepo.constants.normalUserId },
            user: {...adminCreds}
          },
          usersCtrl.deleteUser,
          result => {
            expect(result.body.success).to.be.true;
            expect(result.status).to.equal(200);
            expect(result.body.data).to.deep.equal(
              { results: ["users: deleted 1 items."], totalCount: 1 }
            );

            done();
          }
        );
      });

      it("should not allow a user to delete theirself", (done) => {
        const admin = mockUserRepo.stubs.readOneUser(mockUserRepo.constants.adminUserId);
        admin.isActive = false;
        admin.save();

        executeStack({
            params: { id: mockUserRepo.constants.adminUserId },
            user: {...adminCreds}
          },
          usersCtrl.deleteUser,
          result => {
            expect(result.body.success).to.be.false;
            expect(result.status).to.equal(400);
            expect(result.body.errors).to.deep.equal([
              "You cannot delete yourself.  Use another user that has admin rights."
            ]);

            done();
          }
        );
      });

      it("should allow deleting a user that is not deactivated", (done) => {
        executeStack({
            params: { id: mockUserRepo.constants.normalUserId },
            user: {...adminCreds}
          },
          usersCtrl.deleteUser,
          result => {
            expect(result.body.success).to.be.false;
            expect(result.status).to.equal(400);
            expect(result.body.errors).to.deep.equal([
              "Cannot delete a user that is marked as active."
            ]);

            done();
          }
        );
      });

      it("should return an error if you delete a user that does not exist", (done) => {
        executeStack({
            params: { id: "aaaabbbbccccddddeeeeffff" },
            user: {...adminCreds}
          },
          usersCtrl.deleteUser,
          result => {
            expect(result.body.success).to.be.false;
            expect(result.status).to.equal(404);
            expect(result.body.message).to.equal("No records found for userId aaaabbbbccccddddeeeeffff");

            done();
          }
        );
      });
    });

    describe("with normal credentials", () => {
      it("should not allow a user to delete another user", (done) => {
        const admin = mockUserRepo.stubs.readOneUser(mockUserRepo.constants.adminUserId);
        admin.isActive = false;
        admin.save();

        executeStack({
            params: { id: mockUserRepo.constants.adminUserId },
            user: {...normalCreds}
          },
          usersCtrl.deleteUser,
          result => {
            expect(result.body.success).to.be.false;
            expect(result.status).to.equal(403);
            expect(result.body.message).to.equal("Forbidden");
  
            done();
          }
        );
      });
    });

    describe("with anonymous credentials", () => {
      it("should not allow anonymous user to delete any user", (done) => {
        const admin = mockUserRepo.stubs.readOneUser(mockUserRepo.constants.adminUserId);
        admin.isActive = false;
        admin.save();

        executeStack({
            params: { id: mockUserRepo.constants.adminUserId },
          },
          usersCtrl.deleteUser,
          result => {
            expect(result.body.success).to.be.false;
            expect(result.status).to.equal(403);
            expect(result.body.message).to.equal("Forbidden");
  
            done();
          }
        );
      });
    });
  });
});


// out of date admin token:
// Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiI1ZGNiMTdlOGQxMTQ4Njk1NDA4NjkzNzMiLCJuYW1lIjoiVG9tIEFiYm90dCIsImVtYWlsIjoidHdhYmJvdHRAb3V0bG9vay5jb20iLCJpc0FkbWluIjp0cnVlLCJpYXQiOjE1NzkxMTcwNzR9.mDt1P72VaePJskXwwvdYc1HLF_PDUJ8CI4RgnFKr62U

// out of date user token:
// 





