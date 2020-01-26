const { userSchema, userRepository } = require("../../models/user.model");

const keys = {
  adminUserId: undefined,
  normalUserId: undefined
};

const credentials = {
  adminCreds: undefined,
  normalCreds: undefined,
  password: "test123"
};

function makeCreds(user) {
  const creds = Object.freeze({
    userId: user._id,
    name: user.name,
    email: user.email,
    isAdmin: user.isAdmin
  });
  return creds;
}

async function resetAll() {
  await userSchema.deleteMany();

  const adminUser = await userRepository.createUser({
    name: "System Administrator",
    email: "admin@finish-line.com",
    hashedPassword: "f$2b$10$Gvf8RJGuAw0Ep7SVxAWwzO824AzM3b54iBX9j9UkPR.si4WXXIxvy", // test123
    isAdmin: true,
    isActive: true
  });

  keys.adminUserId = adminUser._id;
  credentials.adminCreds = makeCreds(adminUser);

  const normalUser = await userRepository.createUser({
    name: "Barney Fief",
    email: "barney@gmail.com",
    hashedPassword: "$2b$10$Gvf8RJGuAw0Ep7SVxAWwzO824AzM3b54iBX9j9UkPR.si4WXXIxvy", // test123
    isAdmin: false,
    isActive: true
  });

  keys.normalUserId = normalUser._id;
  credentials.normalCreds = makeCreds(normalUser);
}

module.exports = {
  keys,
  credentials,
  resetAll
};