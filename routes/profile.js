const express = require("express");
const router = express.Router();
const path = require("path");
const multer = require("multer");
const User = require("../models/user");
const { isLoggedIn } = require("../middleware/auth");

// ========================
// Multer Config for Photo Uploads
// ========================
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, "public/uploads/");
  },
  filename: function (req, file, cb) {
    const uniqueName = Date.now() + "-" + file.originalname;
    cb(null, uniqueName);
  },
});
const upload = multer({ storage: storage });

// ========================
// GET: Logged-in User Profile Page
// ========================
router.get("/profile", isLoggedIn, async (req, res) => {
  const sessionUser = req.session.user;
  const userId = sessionUser?._id || req.session.userId;

  if (!userId) return res.redirect("/login");

  try {
    const user = await User.findById(userId);

    if (!user) return res.redirect("/login");

    let locationData;
    try {
      locationData = await getLocationData();
    } catch (error) {
      locationData = { error: "Could not retrieve location" };
    }

    res.render("profile", {
      title: "Your Profile",
      user,
      location: locationData,
    });
  } catch (err) {
    console.error("Error loading profile:", err);
    res.redirect("/dashboard");
  }
});

// ========================
// POST: Update Name, Bio, and Profile Picture
// ========================
router.post("/profile/update", upload.single("photo"), async (req, res) => {
  if (!req.session.user) return res.redirect("/login");

  const { firstName, lastName, bio } = req.body;
  const userId = req.session.user._id;

  try {
    const update = {
      "profile.firstName": firstName?.trim() || "",
      "profile.lastName": lastName?.trim() || "",
      "profile.bio": bio?.trim() || ""
    };

    if (req.file) {
      const photoPath = "/uploads/" + req.file.filename;
      update["profile.profilePicture"] = photoPath;
    }

    const updatedUser = await User.findByIdAndUpdate(userId, update, { new: true });

    req.session.user.profile = {
      ...req.session.user.profile,
      firstName: updatedUser.profile.firstName,
      lastName: updatedUser.profile.lastName,
      bio: updatedUser.profile.bio,
      profilePicture: updatedUser.profile.profilePicture
    };

    res.redirect("/profile");
  } catch (err) {
    console.error("Profile update error:", err);
    res.redirect("/profile");
  }
});

// ========================
// SECTION: Interests (To be refactored)
// ========================
// Add logic here later for /profile/interests

// ========================
// SECTION: Preferences (To be refactored)
// ========================
// Add logic here later for /profile/preferences

// ========================
// GET: Public Read-Only Profile
// ========================
router.get("/profile/:userId", async (req, res) => {
  try {
    const user = await User.findById(req.params.userId).select("username profile");
    if (!user) return res.status(404).render("404");

    const isOwner =
      req.session.user && req.session.user._id === user._id.toString();

    res.render("public-profile", {
      user: {
        _id: user._id,
        username: user.username,
        bio: user.profile?.bio || "",
        interests: user.profile?.interests || [],
        profilePicture: user.profile?.profilePicture || "/default-avatar.png",
      },
      isOwner,
      title: `${user.username}'s Profile`,
    });
  } catch (err) {
    console.error("Public profile error:", err);
    res.redirect("/dashboard");
  }
});

// ========================
// Mock Location Service
// ========================
async function getLocationData() {
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve({
        latitude: 34.0522,
        longitude: -118.2437,
        city: "Los Angeles",
      });
    }, 500);
  });
}

module.exports = router;
