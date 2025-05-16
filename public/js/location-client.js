// public/js/location-client.js

document.getElementById("save-city").addEventListener("click", async () => {
  const query = document.getElementById("city-input").value;
  if (!query) return alert("Please enter a city name");

  const geoUrl = `https://api.geoapify.com/v1/geocode/autocomplete?text=${encodeURIComponent(query)}&limit=1&filter=countrycode:ca,us&apiKey=${GEOAPIFY_AUTOCOMPLETE_KEY}`;
  const geoRes = await fetch(geoUrl);
  const data = await geoRes.json();

  const place = data.features?.[0]?.properties;
  if (!place) return alert("No results found");

  const cityData = {
    city: place.city || place.address_line1,
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
});
