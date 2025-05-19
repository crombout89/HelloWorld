const express = require("express");
const router = express.Router();
const path = require("path");
const multer = require("multer");
const User = require("../models/user");
const Friendship = require("../models/friendship");
const WallPost = require("../models/wallPost");
const { resolveTags } = require("../services/tagService");
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
    const user = await User.findById(userId)
      .populate("profile.tags") // ✅ resolve tag ObjectIds to full tag docs
      .lean();

    if (!user) return res.redirect("/login");

    let locationData;
    try {
      locationData = await getLocationData();
    } catch (error) {
      locationData = { error: "Could not retrieve location" };
    }

    res.render("user/edit-profile", {
      title: "Your Profile",
      user,
      location: locationData,
    });
  } catch (err) {
    console.error("Error loading profile:", err);
    res.redirect("/home");
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
// POST: Add Tag Interests
// ========================
router.post("/profile/interests", isLoggedIn, async (req, res) => {
  const userId = req.session.user._id;
  const interestInput = req.body.interest || ""; // could be single or comma-delimited

  try {
    const rawList = interestInput
      .split(",")
      .map((i) => i.trim())
      .filter(Boolean);

    const tags = await resolveTags(rawList, userId);
    const tagNames = input
      .split(",")
      .map((t) => t.trim())
      .filter(Boolean);

    const user = await User.findById(userId);
    user.profile.interests = tagNames;
    await user.save();

    req.session.user.profile.interests = tagNames;
    res.redirect("/profile");
  } catch (err) {
    console.error("Error updating interests:", err);
    res.redirect("/profile");
  }
});

// ========================
// POST: Remove Tag Interests
// ========================
router.post("/profile/tags/remove", isLoggedIn, async (req, res) => {
  const userId = req.session.userId;
  const { tagId } = req.body;

  try {
    await User.findByIdAndUpdate(userId, {
      $pull: { "profile.tags": tagId },
    });
    res.redirect("/profile");
  } catch (err) {
    console.error("Remove tag error:", err);
    res.status(500).send("Could not remove tag");
  }
});

// ========================
// POST: Update Preferences
// ========================
router.post("/profile/preferences", isLoggedIn, async (req, res) => {
  const userId = req.session.user._id;
  const selectedPrefs = req.body.preferences;

  // Normalize to array (in case only one checkbox is selected)
  const preferences = Array.isArray(selectedPrefs)
    ? selectedPrefs
    : [selectedPrefs];

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
// POST: Save User interest tags
// ========================
router.post("/profile/tags", isLoggedIn, async (req, res) => {
  try {
    const userId = req.session.userId;
    const input = req.body.tags || "";
    const tagNames = input
      .split(",")
      .map((t) => t.trim())
      .filter(Boolean);

    const tags = await resolveTags(tagNames, userId);

    await User.findByIdAndUpdate(userId, {
      "profile.tags": tags.map((tag) => tag._id),
    });

    res.redirect("/profile");
  } catch (err) {
    console.error("Tag update error:", err);
    res.status(500).send("Failed to update interests");
  }
});

// ========================
// GET: Public profile view
// ========================

// Legacy redirect: /profile/:userId/public → /u/:username
router.get("/profile/:userId/public", async (req, res) => {
  try {
    const user = await User.findById(req.params.userId).lean();
    if (!user) return res.status(404).render("404");
    res.redirect(`/u/${user.username}`);
  } catch (err) {
    console.error(err);
    res.status(500).render("error");
  }
});

// Clean user profile route: /u/:username
router.get("/u/:username", async (req, res) => {
  try {
    const viewedUser = await User.findOne({ username: req.params.username })
      .populate("profile.tags")
      .lean();
    if (!viewedUser)
      return res.status(404).render("404", { title: "User Not Found" });

    const currentUserId = req.session?.userId || null;
    const currentUser = currentUserId
      ? await User.findById(currentUserId).lean()
      : null;

    // Default to no relationship
    let friendStatus = "none";

    if (currentUserId && currentUserId !== viewedUser._id.toString()) {
      const friendship = await Friendship.findOne({
        $or: [
          { requester: currentUserId, recipient: viewedUser._id },
          { requester: viewedUser._id, recipient: currentUserId },
        ],
      });

      if (friendship) {
        friendStatus = friendship.status === "accepted" ? "friends" : "pending";
      }
    }

    // Fetch friends of the viewed user
    const friendDocs = await Friendship.find({
      $or: [
        { requester: viewedUser._id, status: "accepted" },
        { recipient: viewedUser._id, status: "accepted" },
      ],
    }).lean();

    const friendIds = friendDocs.map((doc) =>
      doc.requester.toString() === viewedUser._id.toString()
        ? doc.recipient
        : doc.requester
    );

    const friends = await User.find({ _id: { $in: friendIds } }).lean();

    // Only calculate mutuals if logged in
    let mutualFriends = [];
    let myFriendIds = [];

    if (currentUserId) {
      const myFriendDocs = await Friendship.find({
        $or: [
          { requester: currentUserId, status: "accepted" },
          { recipient: currentUserId, status: "accepted" },
        ],
      }).lean();

      myFriendIds = myFriendDocs.map((doc) =>
        doc.requester.toString() === currentUserId
          ? doc.recipient
          : doc.requester
      );

      mutualFriends = await User.find({
        _id: {
          $in: friendIds.filter((id) =>
            myFriendIds.map(String).includes(id.toString())
          ),
        },
      }).lean();
    }

    const canPostToWall =
      currentUserId &&
      myFriendIds.map(String).includes(viewedUser._id.toString());

    const wallPosts = await WallPost.find({ recipient: viewedUser._id })
      .populate({
        path: "author",
        select: "username profile.profilePicture",
      })
      .populate({
        path: "reactions.user",
        select: "username",
      })
      .sort({ createdAt: -1 })
      .lean();

    res.render("user/view-profile", {
      user: viewedUser,
      currentUser,
      includeLeaflet: true,
      friends,
      friendStatus,
      mutualFriends,
      canPostToWall,
      wallPosts,
      session: req.session,
      title: `@${viewedUser.username}'s Profile`,
    });
  } catch (err) {
    console.error(err);
    res.status(500).render("error", { title: "Server Error" });
  }
});

module.exports = router;
