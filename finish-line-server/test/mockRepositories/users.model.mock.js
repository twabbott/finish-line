// 3rd party
const sinon = require("sinon");
const { ObjectId } = require("mongodb");

const { userRepository } = require("../../models/user.model");

const adminUserId = "5dcb17c7d114869540869372";
const normalUserId = "5e181dd1c2a2df9ce85f37b9";
const documentCollection = [];

// Stubs
let createUserStub = undefined; 
let readAllUsersStub = undefined;
let readOneUserStub = undefined;

function initialize() {
  createUserStub = sinon.stub(userRepository, "createUser"); 
  createUserStub.callsFake(item => {
    const now = (new Date).toISOString();
    const newDoc = {
      _id: ObjectId().toString(),
      ...item,
      createdAt: now,
      updatedAt: now
    };

    documentCollection.push(newDoc);
    return newDoc;
  });

  readAllUsersStub = sinon.stub(userRepository, "readAllUsers");
  readAllUsersStub.callsFake(() => documentCollection);

  readOneUserStub = sinon.stub(userRepository, "readOneUser");
  readOneUserStub.callsFake(userId => documentCollection.find(doc => doc._id === userId));
}

function finalize() {
  createUserStub.restore();
  readAllUsersStub.restore();
  readOneUserStub.restore();
}

function reset() {
  documentCollection.length = 0;
  documentCollection.push({
    _id: adminUserId,
    name: "System Administrator",
    email: "admin@finish-line.com",
    hashedPassword: "$2b$10$Gvf8RJGuAw0Ep7SVxAWwzO824AzM3b54iBX9j9UkPR.si4WXXIxvy", // test123
    isAdmin: true,
    createdAt: "2019-11-12T20:36:23.574Z",
    updatedAt: "2020-01-15T20:20:30.735Z",
    __v: 0,
    isActive: true
  });
  documentCollection.push({
    _id: normalUserId,
    name: "Barney Fief",
    email: "barney@gmail.com",
    hashedPassword: "$2b$10$Gvf8RJGuAw0Ep7SVxAWwzO824AzM3b54iBX9j9UkPR.si4WXXIxvy", // test123
    isAdmin: false,
    isActive: true,
    createdAt: "2020-01-10T06:46:41.182Z",
    updatedAt: "2020-01-10T06:46:41.182Z",
    __v: 0
  });

  return documentCollection;
}

module.exports = {
  initialize,
  reset,
  finalize,
  constants: {
    adminUserId,
    normalUserId
  }
};