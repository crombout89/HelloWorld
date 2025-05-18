// middleware/auth.js

function isLoggedIn(req, res, next) {
  if (!req.session?.userId) {
    return res.redirect("/login");
  }
  next();
}

const Community = require("../models/community");

async function isOwner(req, res, next) {
  try {
    const communityId =
      req.query.communityId ||
      req.body.communityId ||
      req.params.communityId ||
      req.params.id;
    const community = await Community.findById(communityId);
    if (!community || community.owner.toString() !== req.session.userId) {
      return res
        .status(403)
        .send("Only the community owner can access this page.");
    }
    next();
  } catch (err) {
    console.error("isOwner middleware error:", err);
    res.status(500).send("Authorization error");
  }
}

module.exports = {
  isLoggedIn,
  isOwner,
};
