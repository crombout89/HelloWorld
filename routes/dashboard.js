const express = require("express");
const router = express.Router();
const User = require("../models/user");
const Friendship = require("../models/friendship");
const Notification = require("../models/notification");

//
// 🛡️ Auth Middleware
//
const isAuthenticated = async (req, res, next) => {
  if (!req.user) return res.redirect("/login");
  next();
};

//
// 📊 Dashboard Route
//
router.get("/", async (req, res) => {
  try {
    const userId = req.session.userId;
    const user = await User.findById(userId).populate("profile.tags").lean();
    if (!user.profile) user.profile = {};

    // 👥 Get Friends
    const friendships = await Friendship.find({
      status: "accepted",
      $or: [{ requester: userId }, { recipient: userId }],
    })
      .populate("requester", "username profile")
      .populate("recipient", "username profile");

    const friends = friendships.map((f) =>
      f.requester._id.toString() === userId ? f.recipient : f.requester
    );

    // 🔔 Get Notifications
    const notifications = await Notification.find({ user: userId }).sort({
      createdAt: -1,
    });

    // 🎯 Render Dashboard (no need to compute location details here)
    res.render("user/home", {
      title: "Dashboard",
      includeLeaflet: true,
      user,
      friends,
      friendCount: friends.length,
      notifications,
      includeLocationClient: true,
    });
  } catch (error) {
    console.error("Dashboard Error:", error);
    res.redirect("/login");
  }
});

//
// 🛠 Profile Edit Page
//
router.get("/profile/edit", isAuthenticated, async (req, res) => {
  try {
    const userId = req.user._id;
    const user = await User.findById(userId).select("-password");

    res.render("user/edit-profile", {
      title: "Edit Profile",
      user,
    });
  } catch (error) {
    console.error("Edit Profile Error:", error);
    res.redirect("/dashboard");
  }
});

router.post("/profile/update", async (req, res) => {
  try {
    const userId = req.session.userId;
    const { firstName, lastName, interests, bio } = req.body;

    const user = await User.findById(userId);

    user.profile.firstName = firstName?.trim() || "";
    user.profile.lastName = lastName?.trim() || "";
    user.profile.bio = bio?.trim() || "";

    // 🧠 Process Interests
    if (interests) {
      user.profile.interests = interests
        .split(",")
        .map((i) => i.trim())
        .filter(Boolean);
    }

    await user.save();

    req.flash("success", "Profile updated successfully");
    res.redirect("/dashboard");
  } catch (error) {
    console.error("Profile Update Error:", error);
    req.flash("error", "Failed to update profile");
    res.redirect("/dashboard");
  }
});

module.exports = router;
