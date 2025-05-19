// services/matchService.js
const haversine = require("haversine-distance");

// 📐 Calculate geographic distance in km
function getDistance(userA, userB) {
  const a = userA?.profile?.location?.address;
  const b = userB?.profile?.location?.address;

  if (!a || !b) return Infinity;

  const [lat1, lon1, lat2, lon2] = [
    a.latitude,
    a.longitude,
    b.latitude,
    b.longitude,
  ];

  if ([lat1, lon1, lat2, lon2].some((v) => typeof v !== "number"))
    return Infinity;

  const distMeters = haversine(
    { lat: lat1, lon: lon1 },
    { lat: lat2, lon: lon2 }
  );
  return distMeters / 1000;
}

// 🕓 Active within last 7 days
function isRecentlyActive(user) {
  if (!user?.lastLogin) return false;
  const oneWeekAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;
  return new Date(user.lastLogin) > oneWeekAgo;
}

// 👥 Mutual friends count
function getMutualFriends(friendsA = [], friendsB = []) {
  const setA = new Set((friendsA || []).map((id) => id.toString()));
  return (friendsB || []).filter((id) => setA.has(id.toString()));
}

// 🧠 Match scoring logic
function calculateMatchScore(userA, userB) {
  let score = 0;

  // 🏷️ Tag overlap (works whether tags are strings or populated objects)
  const tagsA = new Set(
    (userA.profile?.tags || []).map((t) =>
      typeof t === "object" && t._id ? t._id.toString() : t.toString()
    )
  );
  const tagsB = new Set(
    (userB.profile?.tags || []).map((t) =>
      typeof t === "object" && t._id ? t._id.toString() : t.toString()
    )
  );

  // 🌐 Same language
  if (
    userA.profile?.language &&
    userA.profile.language === userB.profile?.language
  ) {
    score += 2;
  }

  // 📍 Location scoring tiers
  const distance = getDistance(userA, userB);
  if (distance < 5) score += 3;
  else if (distance < 25) score += 2;
  else if (distance < 100) score += 1;

  // 🔄 Activity bonus
  if (isRecentlyActive(userB)) score += 1;

  // 👥 Mutual friends
  const mutuals = getMutualFriends(userA.friends, userB.friends);
  score += mutuals.length;

  return score;
}

module.exports = {
  calculateMatchScore,
  getDistance,
  isRecentlyActive,
  getMutualFriends,
};