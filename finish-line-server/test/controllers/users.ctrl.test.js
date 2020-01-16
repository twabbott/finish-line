/* eslint-disable no-unused-vars */

const { expect, assert } = require("chai");

// Dependencies
const restFactory = require("../../middleware/restFactory");
const { mockState, executeMiddleware } = require("../test-utils/express-shim");
const mockUserRepo = require("../mockRepositories/users.model.mock");
const regex = require("../../shared/regex");

// Module under test
const usersCtrl = require("../../controllers/users.ctrl");

describe.only("users.ctrl", () => {
  before(() => {
    restFactory.init({ 
      //traceOn: true,
      errorLogger: err => console.trace(err) 
    });

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
    const state = mockState(mockReq);
    const result = executeMiddleware(state, ...middleware);
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
});








