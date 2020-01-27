/* eslint-disable no-unused-vars, indent */

const { expect, assert } = require("chai");

// Dependencies
const restFactory = require("../../middleware/restFactory");
const { executeMiddleware, executeMiddlewareAsync, trace } = require("../test-utils/express-shim");
const { userRepository } = require("../../models/user.model");
const mockDb = require("../mockRepositories/mock-db");
const userSeed = require("../mockRepositories/user.seed");
const regex = require("../../shared/regex");

// Module under test
const accountsCtrl = require("../../controllers/accounts.ctrl");

describe("accounts.ctrl", () => {
  before(async () => {
    await mockDb.initialize();
  });

  beforeEach(async () => {
    await userSeed.resetAll();
  });

  after(async () => {
    await mockDb.finalize();
  });

  it("should sign in with valid username and password", async () => {
    const result = await executeMiddlewareAsync({
        body: {
          email: "barney@gmail.com",
          password: userSeed.credentials.password
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
          password: userSeed.credentials.password
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
    const normie = await userRepository.readOneUser(userSeed.keys.normalUserId);
    normie.isActive = false;
    await normie.save();

    const result = await executeMiddlewareAsync({
        body: {
          email: "barney@gmail.com",
          password: userSeed.credentials.password
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
