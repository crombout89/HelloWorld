// services/matchService.js

const haversine = require("haversine-distance"); // Optional: For real distance in km

// 📐 Get geographic distance in kilometers between two users
function getDistance(userA, userB) {
  if (!userA?.profile?.location?.address || !userB?.profile?.location?.address)
    return Infinity;

  const { latitude: lat1, longitude: lon1 } = userA.profile.location.address;
  const { latitude: lat2, longitude: lon2 } = userB.profile.location.address;

  if ([lat1, lon1, lat2, lon2].some((v) => typeof v !== "number"))
    return Infinity;

  const distMeters = haversine(
    { lat: lat1, lon: lon1 },
    { lat: lat2, lon: lon2 }
  );
  return distMeters / 1000; // return in km
}

// 🕓 Check if the user was active in the past 7 days
function isRecentlyActive(user) {
  const oneWeekAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;
  return new Date(user.lastLogin) > oneWeekAgo;
}

// 👥 Find mutual friend userIds
function getMutualFriends(friendsA = [], friendsB = []) {
  const setA = new Set(friendsA.map((id) => id.toString()));
  return friendsB.filter((id) => setA.has(id.toString()));
}

// 🧠 Main scoring algorithm for two users
function calculateMatchScore(userA, userB) {
  let score = 0;

  // 🏷️ Shared tags/interests
  const tagsA = new Set(userA.profile?.tags || []);
  const tagsB = new Set(userB.profile?.tags || []);
  tagsB.forEach((tag) => {
    if (tagsA.has(tag)) score += 2;
  });

  const interestsA = new Set(userA.profile?.interests || []);
  const interestsB = new Set(userB.profile?.interests || []);
  interestsB.forEach((interest) => {
    if (interestsA.has(interest)) score += 1;
  });

  // 🌐 Shared language
  if (
    userA.profile?.language &&
    userA.profile.language === userB.profile?.language
  ) {
    score += 2;
  }

  // 📍 Nearby location (under 50km = +1)
  const distance = getDistance(userA, userB);
  if (distance < 50) score += 1;

  // 🔄 Recent activity bonus
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
