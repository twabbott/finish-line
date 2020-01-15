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

  function executeStack(user, body, middleware, callback, timeout=100) {
    const mockReq = {
      user: {...user},
      body: {...body}
    };
  
    const state = mockState(mockReq);
    const result = executeMiddleware(state, ...middleware);
    setTimeout(() => {
      callback(result);
    }, timeout);
  }

  describe("postUser", () => {
    before(() => {
      mockUserRepo.reset();
    });

    after(() => {
    });

    it("should create new user", (done) => {
      const result = executeStack(
        adminCreds,
        mockNewUser,
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

    it("should create new user using anonymous credentials", (done) => {
      const result = executeStack(
        undefined,
        mockNewUser,
        usersCtrl.postUser,
        result => {
          //console.log(result);
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

    it("should not let me create a new admin user using anonymous credentials", (done) => {
      const result = executeStack(
        undefined,
        {
          ...mockNewUser,
          isAdmin: true
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

    it("should not let me create a new admin user using non-admin credentials", (done) => {
      const result = executeStack(
        normalCreds,
        {
          ...mockNewUser,
          isAdmin: true
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








