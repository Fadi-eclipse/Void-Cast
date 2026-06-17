const mongoose = require("mongoose");
const { isEmail } = require("validator");
const { Schema } = mongoose;

const userSchema = new Schema({
  email: {
    type: String,
    unique: true,
    required: [true, "please enter an email"],
    lowercase: true,
    validate: [isEmail, "please enter a valid email"],
  },
  password: {
    type: String,
    required: [true, "please enter a password"],
    select: false,
    minlength: [6, "Minimum password length is 6 char"],
  },
});

const User = mongoose.model("user", userSchema);

module.exports = User;
