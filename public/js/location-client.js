// public/js/location-client.js
document.addEventListener("DOMContentLoaded", () => {
  console.log("✅ location-client.js loaded");

  const input = document.getElementById("city-input");
  const button = document.getElementById("save-city");

  if (!input || !button) return;

  button.addEventListener("click", async () => {
    const query = input.value.trim();
    if (!query) return alert("Please enter a city name");

    try {
      const geoRes = await fetch(
        `https://api.geoapify.com/v1/geocode/autocomplete?text=${encodeURIComponent(query)}&limit=1&type=city&apiKey=${GEOAPIFY_AUTOCOMPLETE_KEY}`
      );
      const data = await geoRes.json();

      const place = data.features?.[0]?.properties;
      if (!place) return alert("❌ No matching city found");

      const cityData = {
        city: place.city || place.name || place.address_line1,
        country: place.country,
        latitude: place.lat,
        longitude: place.lon,
      };

      const res = await fetch("/location/save", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(cityData),
      });

      const result = await res.json();
      if (result.success) {
        alert(`📍 Saved: ${cityData.city}, ${cityData.country}`);
        location.reload();
      } else {
        alert("❌ Failed to save location.");
      }
    } catch (err) {
      console.error(err);
      alert("⚠️ Error looking up city.");
    }
  });
});

document
  .getElementById("use-my-location")
  ?.addEventListener("click", async () => {
    try {
      const res = await fetch(
        `https://api.geoapify.com/v1/ipinfo?apiKey=${GEOAPIFY_AUTOCOMPLETE_KEY}`
      );
      const data = await res.json();

      const place = data.location;
      if (!place || (!place.city && !place.country && !place.latitude)) {
        return alert("❌ Couldn’t determine location");
      }

      const cityData = {
        city: place.city?.name || "Unknown",
        country: place.country?.name || "Unknown",
        latitude: place.latitude,
        longitude: place.longitude,
      };

      const save = await fetch("/location/save", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(cityData),
      });

      const result = await save.json();
      if (result.success) {
        alert(`📍 Saved from IP: ${cityData.city}, ${cityData.country}`);
        location.reload();
      } else {
        alert("❌ Failed to save location.");
      }
    } catch (err) {
      console.error(err);
      alert("⚠️ IP-based location failed.");
    }
  });