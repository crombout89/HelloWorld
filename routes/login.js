const express = require("express");
const router = express.Router();
const User = require("../models/user");

// GET Login Page
router.get("/", (req, res) => {
  res.render("user/login", {
    title: "Login",
    error: null,
    layout: "layout", // ⬅️ force it
  });
});

// POST Login Route
router.post("/", async (req, res) => {
  try {
    const { username, password } = req.body;

    const user = await User.findOne({ username });

    if (!user) {
      return res.render("user/login", {
        title: "Login",
        error: "User not found",
      });
    }

    const isMatch = await user.comparePassword(password);

    if (!isMatch) {
      return res.render("user/login", {
        title: "Login",
        error: "Invalid credentials",
      });
    }

    // Set session
    req.session.userId = user._id;
    req.session.user = {
      _id: user._id,
      username: user.username,
      email: user.email,
      createdAt: user.createdAt,
      profile: user.profile || {},
    };

    res.redirect("/home");
  } catch (error) {
    console.error("Login Error:", error);
    res.render("user/login", {
      title: "Login",
      error: "An unexpected error occurred",
    });
  }
});

// POST Logout Route
router.post("/logout", (req, res) => {
  req.session.destroy((err) => {
    if (err) {
      console.error("Logout Error:", err);
      return res.redirect("/dashboard");
    }
    res.clearCookie("connect.sid"); // optional: clear session cookie
    res.redirect("/login");
  });
});


module.exports = router;
