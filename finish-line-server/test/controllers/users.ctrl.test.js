/* eslint-disable no-unused-vars */

const { expect, assert } = require("chai");
const sinon = require("sinon");

// Dependencies
const restFactory = require("../../middleware/restFactory");
const { mockState, executeMiddleware } = require("../test-utils/express-shim");

// Module under test
const usersCtrl = require("../../controllers/users.ctrl");

// Modules to be mocked
const { userRepository } = require("../../models/user.model");

describe.only("users.ctrl", () => {
  before(() => {
    restFactory.init({ 
      //traceOn: true,
      errorLogger: err => console.trace(err) 
    });
  });

  const adminCreds = {
    userId: "111122223333444455550000",
    name: "Admin",
    email: "admin@foo.com",
    isAdmin: true
  };

  const normalCreds = {
    userId: "111122223333444455550001",
    name: "Test User",
    email: "test.user@foo.com",
    isAdmin: false
  };

  const mockUser = {
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
    const mockId = "0123456789abcdef01234567";
    const mockDate = "2020-01-15T05:32:08.551Z";
    const createUserStub = sinon.stub(userRepository, "createUser"); 

    before(() => {
      createUserStub.callsFake(u => {
        return {
          _id: mockId,
          ...u,
          createdAt: mockDate,
          updatedAt: mockDate
        };
      });
    });

    after(() => {
      createUserStub.restore();
    });

    it("should create new user", (done) => {
      const result = executeStack(
        adminCreds,
        mockUser,
        [usersCtrl.postUser],
        result => {
          //console.log(result);
          expect(result.body.success).to.be.true;
          expect(result.status).to.equal(201);
          expect(result.body.data).to.deep.equal({
            id: mockId,
            name: "Fred Flintstone",
            email: "fred.flintstone@hb.com",
            isAdmin: false,
            isActive: true,
            createdAt: mockDate,
            updatedAt: mockDate
          });
          expect(result.headers).to.deep.equal({ 
            Location: "http://blah.com//0123456789abcdef01234567" 
          });
  
          done();
        }
      );
    });

    it("should create new user using anonymous credentials", (done) => {
      const result = executeStack(
        undefined,
        mockUser,
        [usersCtrl.postUser],
        result => {
          //console.log(result);
          expect(result.body.success).to.be.true;
          expect(result.status).to.equal(201);
          expect(result.body.data).to.deep.equal({
            id: mockId,
            name: "Fred Flintstone",
            email: "fred.flintstone@hb.com",
            isAdmin: false,
            isActive: true,
            createdAt: mockDate,
            updatedAt: mockDate
          });
          expect(result.headers).to.deep.equal({ 
            Location: "http://blah.com//0123456789abcdef01234567" 
          });
  
          done();
        }
      );
    });

    it("should not let me create a new admin user using anonymous credentials", (done) => {
      const result = executeStack(
        undefined,
        {
          ...mockUser,
          isAdmin: true
        },
        [usersCtrl.postUser],
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
          ...mockUser,
          isAdmin: true
        },
        [usersCtrl.postUser],
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








