const mongoose = require("mongoose");

function ValidateEmail(address) 
{
  return /^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/.test(address);
}

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
          return ValidateEmail(address);
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

module.exports = {
  userSchema
};