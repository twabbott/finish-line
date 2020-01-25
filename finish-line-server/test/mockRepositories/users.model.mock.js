// 3rd party
const sinon = require("sinon");
const { ObjectId } = require("mongodb");

const { userRepository } = require("../../models/user.model");

const constants = Object.freeze({
  adminUserId: "5dcb17c7d114869540869372",
  normalUserId: "5e181dd1c2a2df9ce85f37b9",
  password: "test123"
});

const documentCollection = [];

function makeCreds(user) {
  const creds = Object.freeze({
    userId: user._id,
    name: user.name,
    email: user.email,
    isAdmin: user.isAdmin
  });
  return creds;
}

const mockFuncs = {
  save() {}
};

const documents = Object.freeze({
  adminUser: {
    _id: constants.adminUserId,
    name: "System Administrator",
    email: "admin@finish-line.com",
    hashedPassword: "f$2b$10$Gvf8RJGuAw0Ep7SVxAWwzO824AzM3b54iBX9j9UkPR.si4WXXIxvy", // test123
    isAdmin: true,
    isActive: true,
    createdAt: "2019-11-12T20:36:23.574Z",
    updatedAt: "2020-01-15T20:20:30.735Z",
    __v: 0,
    ...mockFuncs
  },

  normalUser: {
    _id: constants.normalUserId,
    name: "Barney Fief",
    email: "barney@gmail.com",
    hashedPassword: "$2b$10$Gvf8RJGuAw0Ep7SVxAWwzO824AzM3b54iBX9j9UkPR.si4WXXIxvy", // test123
    isAdmin: false,
    isActive: true,
    createdAt: "2020-01-10T06:46:41.182Z",
    updatedAt: "2020-01-10T06:46:41.182Z",
    __v: 0,
    ...mockFuncs
  }
});

const adminCreds = makeCreds(documents.adminUser);

const normalCreds = makeCreds(documents.normalUser);

// Stubs
const stubs = {
  createUser: undefined,
  readAllUsers: undefined,
  readOneUser: undefined,
  readByEmail: undefined,
  deleteUser: undefined
};

function initialize() {
  stubs.createUser = sinon
    .stub(userRepository, "createUser")
    .callsFake(item => {
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

  stubs.readAllUsers = sinon
    .stub(userRepository, "readAllUsers")
    .callsFake(() => documentCollection);

  stubs.readOneUser = sinon
    .stub(userRepository, "readOneUser")
    .callsFake(userId => {
      const user = documentCollection.find(doc => doc._id === userId);

      return user;
    });

  stubs.readByEmail = sinon
    .stub(userRepository, "readByEmail")
    .callsFake(email => {
      const user = documentCollection.find(doc => doc.email === email);

      return user;
    });

  stubs.deleteUser = sinon
    .stub(userRepository, "deleteUser")
    .callsFake(userId => {
      const count = documentCollection.length;
      const idx = documentCollection.findIndex(item => item._id === userId);
      if (idx >= 0) {
        documentCollection.splice(idx, 1);
      }
      return count - documentCollection.length;
    });
}

function finalize() {
  stubs.createUser.restore();
  stubs.readAllUsers.restore();
  stubs.readOneUser.restore();
  stubs.readByEmail.restore();
  stubs.deleteUser.restore();
}

function reset() {
  const mockFuncs = {
    save: () => {}
  };

  documentCollection.length = 0;
  for (let doc in documents) {
    documentCollection.push({
      ...documents[doc],
      ...mockFuncs
    });
  }

  return documentCollection;
}

module.exports = {
  initialize,
  reset,
  finalize,
  stubs,
  constants,
  documents,
  credentials: {
    adminCreds,
    normalCreds
  }
};