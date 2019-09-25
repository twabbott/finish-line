const mongoose = require("mongoose");
const Schema = mongoose.Schema;

function ValidateEmail(address) 
{
  return /^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/.test(address);
}

const userSchema = new Schema(
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
    password: { 
      type: String, 
      trim: true,
      required: true,
      maxlength: 30
    }
  },
  { 
    timestamps: true 
  },
);

module.exports = mongoose.model("users", userSchema);
