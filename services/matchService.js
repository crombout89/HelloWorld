// services/matchService.js

// 🔍 Core matching logic based on shared profile traits
function calculateMatchScore(userA, userB) {
    let score = 0;
  
    // ✅ Interests overlap (weighted more heavily)
    const interestsA = new Set(userA.profile?.interests || []);
    const interestsB = new Set(userB.profile?.interests || []);
    const sharedInterests = [...interestsA].filter(i => interestsB.has(i));
    score += sharedInterests.length * 2;
  
    // ✅ Preferences overlap
    const preferencesA = new Set(userA.profile?.preferences || []);
    const preferencesB = new Set(userB.profile?.preferences || []);
    const sharedPreferences = [...preferencesA].filter(p => preferencesB.has(p));
    score += sharedPreferences.length;
  
    // ✅ Language match
    if (userA.profile?.language === userB.profile?.language) {
      score += 2;
    }
  
    // 🧪 Future: Boost score for recent activity (e.g. login, RSVP, posts)
    // score += isRecentlyActive(userB) ? 1 : 0;
  
    // 📍 Future: Adjust score by geographic proximity
    // const distance = getDistance(userA.location, userB.location);
    // if (distance < 50km) score += 1;
  
    // 🧠 Future: Prioritize matches with mutual friends
    // const mutuals = getMutualFriends(userA.friends, userB.friends);
    // score += mutuals.length;
  
    // 🪄 Future: Sentiment or tone analysis of bio/description
    // score += hasMatchingTone(userA.bio, userB.bio) ? 1 : 0;
  
    return {
      score,
      sharedInterests,
      sharedPreferences,
      languageMatch: userA.profile?.language === userB.profile?.language,
    };
  }

module.exports = { calculateMatchScore };
