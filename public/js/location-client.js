// public/js/location-client.js

async function updateMyLocation() {
  try {
    const pos = await new Promise((resolve, reject) =>
      navigator.geolocation.getCurrentPosition(resolve, reject, {
        timeout: 5000,
      })
    );

    const res = await fetch("/location/update", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        latitude: pos.coords.latitude,
        longitude: pos.coords.longitude,
      }),
    });

    const data = await res.json();
    if (data.success) {
      alert(`📍 Updated to ${data.location.city}, ${data.location.country}`);
      location.reload();
    } else {
      throw new Error(data.error || "Unknown error");
    }
  } catch (err) {
    alert(`⚠️ Location update failed: ${err.message}`);
    console.error(err);
  }
}
