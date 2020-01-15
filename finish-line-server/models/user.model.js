const mongoose = require("mongoose");
const mongodb = require("mongodb");
const regex = require("../shared/regex");

const usersSchema = new mongoose.Schema(
  {
    name: { 
      type: String, 
      trim: true,
      required: true,
      maxlength: 30
    },
    email: { 
      type: String, 
      unique: true,
      required: true,
      trim: true,
      lowercase: true,
      validate: {
        validator: function(address) {
          return regex.email.test(address);
        },
        message: "Invalid email address"
      }
    },
    hashedPassword: { 
      type: String, 
      trim: true,
      required: true,
      maxlength: 256
    },
    isAdmin: {
      type: Boolean,
      required: true
    },
    isActive: { 
      type: Boolean, 
      required: true 
    },
  },
  { 
    timestamps: true 
  },
);

const userSchema = mongoose.model("users", usersSchema);

const userRepository = {
  createUser: async(user) => {
    const doc = new userSchema(user);
    return await doc.save();
  },

  readAllUsers: async() => {
    return await userSchema.find();
  },

  readOneUser: async (userId) => {
    if (!mongodb.ObjectID.isValid(userId)) {
      return null;
    }

    return await userSchema.findById(userId);
  },

  readByEmail: async (email) => {
    const [user] = await userSchema.find({ email });
    return user;
  },

  deleteUser: async (userId) => {
    if (!mongodb.ObjectID.isValid(userId)) {
      return null;
    }

    const result = await userSchema.deleteOne({ _id: userId });
    return (result && result.deletedCount) || 0;
  }
};

module.exports = {
  userSchema,
  userRepository
};