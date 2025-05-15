const Friendship = require("../models/friendship");

async function areFriends(userA, userB) {
  const friendship = await Friendship.findOne({
    $or: [
      { requester: userA, recipient: userB, status: "accepted" },
      { requester: userB, recipient: userA, status: "accepted" },
    ],
  });

  return Boolean(friendship);
}

async function getFriendsForUser(userId) {
  const friendships = await Friendship.find({
    status: "accepted",
    $or: [{ requester: userId }, { recipient: userId }],
  }).populate("requester recipient", "username profile");

  return friendships.map((f) => {
    return f.requester._id.toString() === userId ? f.recipient : f.requester;
  });
}

module.exports = {
  areFriends,
  getFriendsForUser, // ✅ make sure this is here
};
