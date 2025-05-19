const haversine = require("haversine-distance");

function getDistanceMeters(lat1, lon1, lat2, lon2) {
  if ([lat1, lon1, lat2, lon2].some((v) => typeof v !== "number"))
    return Infinity;
  return haversine({ lat: lat1, lon: lon1 }, { lat: lat2, lon: lon2 });
}

// 🔍 Score an event or community against the user
function calculateItemMatch(user, item) {
  let score = 0;

  // 🏷️ Tag match
  const userTags = new Set((user.profile?.tags || []).map((t) => t.toString()));
  const itemTags = (item.tags || []).map((t) =>
    typeof t === "object" && t._id ? t._id.toString() : t.toString()
  );
  const overlap = itemTags.filter((t) => userTags.has(t));
  score += overlap.length;

  // 📍 Location bonus
  const userLoc = user.profile?.location?.address;
  const itemLoc = item.location || item.address;

  if (userLoc?.latitude && userLoc?.longitude && itemLoc?.lat && itemLoc?.lon) {
    const distKm =
      getDistanceMeters(
        userLoc.latitude,
        userLoc.longitude,
        itemLoc.lat,
        itemLoc.lon
      ) / 1000;
    if (distKm < 5) score += 3;
    else if (distKm < 25) score += 2;
    else if (distKm < 100) score += 1;
  }

  return score;
}

module.exports = { calculateItemMatch };
