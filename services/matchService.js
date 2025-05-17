// services/matchService.js

function calculateMatchScore(currentUser, otherUser) {
  if (!otherUser.profile) return 0;

  let score = 0;

  const myInterests = currentUser.profile.interests || [];
  const myPreferences = currentUser.profile.preferences || [];
  const myLanguage = currentUser.profile.language;

  const theirInterests = otherUser.profile.interests || [];
  const theirPreferences = otherUser.profile.preferences || [];
  const theirLanguage = otherUser.profile.language;

  // Shared interests: 3 points each
  const sharedInterests = theirInterests.filter((i) => myInterests.includes(i));
  score += sharedInterests.length * 3;

  // Shared preferences: 2 points each
  const sharedPreferences = theirPreferences.filter((p) =>
    myPreferences.includes(p)
  );
  score += sharedPreferences.length * 2;

  // Shared language: 1 point
  if (myLanguage && theirLanguage && myLanguage === theirLanguage) {
    score += 1;
  }

  return score;
}

module.exports = { calculateMatchScore };
