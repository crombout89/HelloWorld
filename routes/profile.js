const express = require("express");
const router = express.Router();
const path = require("path");
const multer = require("multer");
const User = require("../models/user");

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
router.get("/profile", async (req, res) => {
  const sessionUser = req.session.user;
  if (!sessionUser) return res.redirect("/login");

  if (!sessionUser.preferences) sessionUser.preferences = [];
  if (!sessionUser.interests) sessionUser.interests = [];

  const userData = {
    username: sessionUser.username,
    email: sessionUser.email || "Not provided",
    role: sessionUser.role || "user",
    joinDate: sessionUser.createdAt
      ? new Date(sessionUser.createdAt).toLocaleDateString()
      : "Unknown",
    interests: sessionUser.interests,
    preferences: sessionUser.preferences,
    name: sessionUser.name || "",
    bio: sessionUser.bio || "",
    photo: sessionUser.photo || "",
  };

  let locationData;
  try {
    locationData = await getLocationData();
  } catch (error) {
    locationData = { error: "Could not retrieve location" };
  }

  res.render("profile", {
    title: "Your Profile",
    user: userData,
    location: locationData,
  });
});

// ========================
// POST: Add Interest
// ========================
router.post("/profile/interests", (req, res) => {
  const newInterest = req.body.interest?.trim();
  if (!req.session.user.interests) {
    req.session.user.interests = [];
  }
  if (newInterest && !req.session.user.interests.includes(newInterest)) {
    req.session.user.interests.push(newInterest);
  }
  res.redirect("/profile");
});

// ========================
// POST: Update Preferences
// ========================
router.post("/profile/preferences", (req, res) => {
  const selected = req.body.preferences || [];
  req.session.user.preferences = Array.isArray(selected)
    ? selected
    : [selected];
  res.redirect("/profile");
});

// ========================
// POST: Update Profile Info (Name, Bio, Photo) + Persist to DB
// ========================
router.post("/profile/update", upload.single("photo"), async (req, res) => {
  if (!req.session.user) return res.redirect("/login");
  const { name, bio } = req.body;
  const userId = req.session.user._id;

  try {
    const update = {
      "profile.name": name,
      "profile.bio": bio,
    };

    if (req.file) {
      const photoPath = "/uploads/" + req.file.filename;
      update["profile.photo"] = photoPath;
      req.session.user.photo = photoPath;
    }

    await User.findByIdAndUpdate(userId, update);

    // Sync session
    req.session.user.name = name;
    req.session.user.bio = bio;

    res.redirect("/profile");
  } catch (err) {
    console.error("Profile update error:", err);
    res.redirect("/profile");
  }
});

// ========================
// GET: Public Read-Only Profile
// ========================
router.get("/profile/:userId", async (req, res) => {
  try {
    const user = await User.findById(req.params.userId).select(
      "username profile"
    );
    if (!user) return res.status(404).render("404");

    const isOwner =
      req.session.user && req.session.user._id === user._id.toString();

    res.render("public-profile", {
      user,
      isOwner,
      title: `${user.username}'s Profile`,
    });
  } catch (err) {
    console.error("Public profile error:", err);
    res.redirect("/dashboard");
  }
});

// ========================
// Mock Location Service (Used in Profile)
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