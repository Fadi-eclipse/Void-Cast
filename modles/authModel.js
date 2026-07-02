const mongoose = require("mongoose");
const { isEmail } = require("validator");
const { Schema } = mongoose;
const bcrypt = require("bcrypt");

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

//fire a function after a user been saved
userSchema.pre("save", async function () {
  const salt = await bcrypt.genSalt();
  this.password = await bcrypt.hash(this.password, salt);
});

userSchema.post("save", async function (doc) {
  console.log("new user was created", doc);
});

userSchema.statics.login = async function (email, password) {
  const user = await this.findOne({ email }).select("+password");

  if (!user) {
    throw Error("incorrect email");
  }

  const auth = await bcrypt.compare(password, user.password);
  if (auth) {
    return user;
  }

  throw Error("incorrect password");
};

const User = mongoose.model("user", userSchema);

module.exports = User;
