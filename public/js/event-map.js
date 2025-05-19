console.log("🗺️ Event map script loaded");

window.initEventMap = function initEventMap(
  mapElementId = "event-map",
  latInputId = "lat",
  lonInputId = "lon",
  initial = [49.25, -123.1],
  zoom = 10
) {
  const map = L.map(mapElementId).setView(initial, zoom);

  L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
    attribution: "&copy; OpenStreetMap contributors",
  }).addTo(map);

  let marker;

  map.on("click", async (e) => {
    const { lat, lng } = e.latlng;

    // Update hidden inputs
    document.getElementById(latInputId).value = lat;
    document.getElementById(lonInputId).value = lng;

    // 🔁 Reverse geocode with LocationIQ
    try {
      const res = await fetch(`/location/reverse?lat=${lat}&lon=${lng}`);
      const data = await res.json();

      if (data.success) {
        const { city, country, displayName } = data;
        const nameInput = document.getElementById("location-name");
        const addressInput = document.getElementById("location-address");

        if (nameInput) nameInput.value = city || "";
        if (addressInput) {
          addressInput.value =
            data.fullAddress ||
            `${data.road || ""} ${data.houseNumber || ""}, ${data.city || ""}, ${data.country || ""}`;
        }
      }
    } catch (err) {
      console.error("❌ Failed to reverse geocode:", err);
    }

    // Drop a pin
    if (marker) {
      marker.setLatLng(e.latlng);
    } else {
      marker = L.marker(e.latlng).addTo(map);
    }
  });

  return map;
};
