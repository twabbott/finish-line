const config = require('config');
const jwt = require('jsonwebtoken');
const Joi = require('joi');
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
      type: Boolean
    }
  },
  { 
    timestamps: true 
  },
);

usersSchema.methods.generateAuthToken = function() { 
  const token = jwt.sign({ _id: this._id, isAdmin: this.isAdmin }, config.get('myprivatekey')); //get the private key from the config file -> environment variable
  return token;
}

//function to validate user 
function validateUser(user) {
  const schema = {
    name: Joi.string().min(3).max(50).required(),
    email: Joi.string().min(5).max(255).required().email(),
    password: Joi.string().min(3).max(255).required()
  };

  return Joi.validate(user, schema);
}

exports.userSchema = mongoose.model("users", usersSchema);
exports.validate = validateUser;