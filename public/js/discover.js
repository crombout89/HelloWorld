// DISCOVER.JS — handles discovery interactions, modals, redirects

document.addEventListener("DOMContentLoaded", () => {
  const discoveryGrid = document.getElementById("discoveryGrid");
  const searchModal = document.getElementById("searchModal");
  const modalContent = document.getElementById("modalContent");
  const closeModalBtn = document.getElementById("closeModal");

  // 🔹 Handle close modal
  closeModalBtn?.addEventListener("click", () => {
    searchModal.style.display = "none";
  });

  // 🔹 Handle clicks on discovery cards
  discoveryGrid?.addEventListener("click", (event) => {
    const card = event.target.closest(".discovery-card");
    if (!card) return;

    const searchType = card.dataset.searchType;

    // 🔸 Routing rules for redirect types
    const redirectMap = {
      communities: "/discover/communities",
      "find-friends": "/discover/friends",
    };

    if (redirectMap[searchType]) {
      window.location.href = redirectMap[searchType];
    } else {
      openSearchModal(searchType);
    }
  });
});

// 🔹 Opens a modal and injects form/logic based on the search type
function openSearchModal(type) {
  let modalHTML = "";

  switch (type) {
    case "search-by-location":
      modalHTML = `
          <h2>Search by Location</h2>
          <form id="locationSearchForm">
            <input 
              type="text" 
              name="location" 
              placeholder="Enter city or address" 
              required
            />
            <button type="submit">Search</button>
          </form>
        `;
      break;

    case "near-me":
      modalHTML = `
          <h2>Events Near Me</h2>
          <button id="findLocationBtn">Use My Location</button>
        `;
      break;

    default:
      modalHTML = `<h2>${type.replace("-", " ").toUpperCase()}</h2>`;
  }

  const modalContent = document.getElementById("modalContent");
  const searchModal = document.getElementById("searchModal");

  modalContent.innerHTML = modalHTML;
  searchModal.style.display = "flex";

  // Attach logic to buttons if they exist
  if (type === "near-me") {
    document
      .getElementById("findLocationBtn")
      ?.addEventListener("click", findCurrentLocation);
  }

  if (type === "search-by-location") {
    document
      .getElementById("locationSearchForm")
      ?.addEventListener("submit", handleLocationSearch);
  }
}

// 🔹 Attempt to use browser geolocation
function findCurrentLocation() {
  if (!("geolocation" in navigator)) {
    alert("Geolocation is not supported by your browser");
    return;
  }

  navigator.geolocation.getCurrentPosition(
    (position) => {
      const { latitude, longitude } = position.coords;
      console.log(`Latitude: ${latitude}, Longitude: ${longitude}`);
      // TODO: route to backend search with /discover/nearby?lat=...&lng=...
    },
    (error) => {
      console.error("Error getting location", error);
      alert("Could not retrieve your location");
    }
  );
}

// 🔹 Handles submission of location search form
function handleLocationSearch(event) {
  event.preventDefault();
  const formData = new FormData(event.target);
  const location = formData.get("location");
  console.log("Searching for location:", location);
  // TODO: Redirect to /discover/location-search?query=...
}