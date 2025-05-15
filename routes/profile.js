const express = require("express");
const router = express.Router();
const path = require("path");
const multer = require("multer");
const User = require("../models/user");
const Friendship = require("../models/friendship");
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

// ===================================================
// POST: Update Name, Bio, Language and Profile Picture
// ===================================================
router.post("/profile/update", upload.single("photo"), async (req, res) => {
  if (!req.session.user) return res.redirect("/login");

  const { firstName, lastName, bio, language } = req.body;
  const userId = req.session.user._id;

  try {
    const update = {
      "profile.firstName": firstName?.trim() || "",
      "profile.lastName": lastName?.trim() || "",
      "profile.language": language?.trim(),
      "profile.bio": bio?.trim() || "",
    };

    if (req.file) {
      const photoPath = "/uploads/" + req.file.filename;
      update["profile.profilePicture"] = photoPath;
    }

    const updatedUser = await User.findByIdAndUpdate(userId, update, {
      new: true,
    });

    req.session.user.profile = {
      ...req.session.user.profile,
      firstName: updatedUser.profile.firstName,
      lastName: updatedUser.profile.lastName,
      bio: updatedUser.profile.bio,
      profilePicture: updatedUser.profile.profilePicture,
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
// POST: Update Interests
// ========================
router.post("/profile/interests", isLoggedIn, async (req, res) => {
  const userId = req.session.user._id;
  const newInterest = req.body.interest?.trim();

  if (!newInterest) return res.redirect("/profile");

  try {
    const user = await User.findById(userId);
    if (!user) return res.redirect("/login");

    if (!Array.isArray(user.profile.interests)) {
      user.profile.interests = [];
    }

    if (!user.profile.interests.includes(newInterest)) {
      user.profile.interests.push(newInterest);
      await user.save();

      // Also update session
      req.session.user.profile.interests = user.profile.interests;
    }

    res.redirect("/profile");
  } catch (err) {
    console.error("Error updating interests:", err);
    res.redirect("/profile");
  }
});

// ========================
// Add logic here later for /profile/interests

// ========================
// SECTION: Preferences (To be refactored)
// ========================
// POST: Update Preferences
// ========================
router.post("/profile/preferences", isLoggedIn, async (req, res) => {
  const userId = req.session.user._id;
  const selectedPrefs = req.body.preferences;

  // Normalize to array (in case only one checkbox is selected)
  const preferences = Array.isArray(selectedPrefs) ? selectedPrefs : [selectedPrefs];

  try {
    const user = await User.findById(userId);
    if (!user) return res.redirect("/login");

    user.profile.preferences = preferences;
    await user.save();

    req.session.user.profile.preferences = preferences;
    res.redirect("/profile");
  } catch (err) {
    console.error("Error updating preferences:", err);
    res.redirect("/profile");
  }
});

// ========================
// Add logic here later for /profile/preferences

// ========================
// GET: Public Read-Only Profile
// ========================
router.get("/profile/:userId", async (req, res) => {
  try {
    const viewingUser = await User.findById(req.params.userId).select(
      "username profile"
    );
    if (!viewingUser) return res.status(404).render("404");

    const isOwner =
      req.session.user && req.session.user._id === viewingUser._id.toString();

    let friendStatus = "none"; // default

    if (!isOwner && req.session.user) {
      const currentUserId = req.session.user._id;

      const friendship = await Friendship.findOne({
        $or: [
          { sender: currentUserId, receiver: viewingUser._id },
          { sender: viewingUser._id, receiver: currentUserId },
        ],
      });

      if (friendship) {
        if (friendship.status === "accepted") {
          friendStatus = "friends";
        } else if (friendship.status === "pending") {
          friendStatus = "pending";
        }
      }
    }

    res.render("public-profile", {
      user: {
        _id: viewingUser._id,
        username: viewingUser.username,
        bio: viewingUser.profile?.bio || "",
        interests: viewingUser.profile?.interests || [],
        profilePicture:
          viewingUser.profile?.profilePicture ||
          "/assets/imgs/demo-profile-1.png",
      },
      isOwner,
      friendStatus,
      title: `${viewingUser.username}'s Profile`,
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
