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

module.exports = { areFriends };
