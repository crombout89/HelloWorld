document.addEventListener("DOMContentLoaded", () => {
  const discoveryGrid = document.getElementById("discoveryGrid");

  const redirectMap = {
    communities: "/discover/communities",
    events: "/discover/events",
    "find-friends": "/discover/friends",
    interests: "/discover/interests",
    "near-me": "geolocation", // special case handled below
  };

  discoveryGrid?.addEventListener("click", async (event) => {
    const card = event.target.closest(".discovery-card");
    if (!card) return;

    const searchType = card.dataset.searchType;

    if (redirectMap[searchType] === "geolocation") {
      if (!navigator.geolocation) {
        alert("Geolocation not supported by your browser.");
        return;
      }

      navigator.geolocation.getCurrentPosition(
        (position) => {
          const { latitude, longitude } = position.coords;
          window.location.href = `/discover/nearby?lat=${latitude}&lon=${longitude}`;
        },
        (err) => {
          console.error("Geolocation error:", err);
          alert("Could not retrieve your location.");
        }
      );
    } else if (redirectMap[searchType]) {
      window.location.href = redirectMap[searchType];
    }
  });
});
