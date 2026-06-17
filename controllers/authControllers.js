const User = require("../modles/authModel");

const handleError = (error) => {
  console.log(error.message, error.code);
  let err = { email: "", password: "" };

  //duplicate email

  if (error.code === 11000) {
    err.email = "Email already registered";
    return err;
  }

  if (error.message.includes("user validation failed")) {
    Object.values(error.errors).forEach(({ properties }) => {
      err[properties.path] = properties.message;
    });
  }
  return err;
};

const signup_get = (req, res) => {
  res.render("signup");
};
const login_get = (req, res) => {
  res.render("login");
};
const signup_post = async (req, res) => {
  const { email, password } = req.body;

  try {
    const user = await User.create({ email, password });
    res.status(201).json(user);
  } catch (error) {
    const errors = handleError(error);
    res.status(400).json({ errors });
  }
};
const login_post = async (req, res) => {
  const { email, password } = req.body;
};

module.exports = {
  signup_get,
  login_get,
  signup_post,
  login_post,
};
