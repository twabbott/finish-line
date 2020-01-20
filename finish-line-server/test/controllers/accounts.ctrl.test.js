/* eslint-disable no-unused-vars, indent */

const { expect, assert } = require("chai");

// Dependencies
const restFactory = require("../../middleware/restFactory");
const { executeMiddleware, executeMiddlewareAsync, trace } = require("../test-utils/express-shim");
const mockUserRepo = require("../mockRepositories/users.model.mock");
const regex = require("../../shared/regex");

// Module under test
const accountsCtrl = require("../../controllers/accounts.ctrl");

describe("accounts.ctrl", () => {
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

  beforeEach(() => {
    mockUserRepo.reset();
  });

  it("should sign in with valid username and password", async () => {
    const result = await executeMiddlewareAsync({
        body: {
          email: "barney@gmail.com",
          password: mockUserRepo.constants.password
        },
      },
      accountsCtrl.signin
    );

    expect(result.body.success).to.be.true;
    expect(result.status).to.equal(201);
    expect(result.body.data.length).to.be.greaterThan(100);
  });

  it("should not sign in with invalid username", async () => {
    const result = await executeMiddlewareAsync({
        body: {
          email: "foo@nowhere.com",
          password: mockUserRepo.constants.password
        },
      },
      accountsCtrl.signin
    );

    expect(result.body.success).to.be.false;
    expect(result.status).to.equal(401);
    expect(result.headers).to.deep.equal({ "WWW-Authenticate": "Bearer realm=\"Finish line\"" });
    expect(result.body.message).to.equal("Invalid username");
  });

  it("should not sign in with invalid password", async () => {
    const result = await executeMiddlewareAsync({
        body: {
          email: "barney@gmail.com",
          password: "foobar"
        },
      },
      accountsCtrl.signin
    );

    expect(result.body.success).to.be.false;
    expect(result.status).to.equal(401);
    expect(result.headers).to.deep.equal({ "WWW-Authenticate": "Bearer realm=\"Finish line\"" });
    expect(result.body.message).to.equal("Invalid password");
  });

  it("should not sign in if user has been deactivated", async () => {
    const normie = mockUserRepo.stubs.readOneUser(mockUserRepo.constants.normalUserId);
    normie.isActive = false;
    normie.save();

    const result = await executeMiddlewareAsync({
        body: {
          email: "barney@gmail.com",
          password: mockUserRepo.constants.password
        },
      },
      accountsCtrl.signin
    );

    expect(result.body.success).to.be.false;
    expect(result.status).to.equal(401);
    expect(result.headers).to.deep.equal({ "WWW-Authenticate": "Bearer realm=\"Finish line\"" });
    expect(result.body.message).to.equal("User account has been deactivated");
  });
});
