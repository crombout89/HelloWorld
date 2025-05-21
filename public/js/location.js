console.log("🌐 Location script loaded");
document.addEventListener("DOMContentLoaded", () => {
  const saveBtn = document.querySelector("#save-location-btn");
  const cityInput = document.querySelector("#location-city");
  const countryInput = document.querySelector("#location-country");
  const useCurrentBtn =
    document.getElementById("use-current-location") ||
    document.getElementById("dashboard-use-current-location");
  const statusEl =
    document.getElementById("location-status") ||
    document.getElementById("dashboard-location-status");

  // 📍 Manual Location Save
  if (saveBtn) {
    saveBtn.addEventListener("click", async () => {
      const city = cityInput.value.trim();
      const country = countryInput.value.trim();

      if (!city || !country) {
        return alert("Please enter both city and country.");
      }

      try {
        const res = await fetch("/location/save", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ city, country }),
        });

        const data = await res.json();
        if (data.success) {
          statusEl.textContent = `✅ Saved location: ${data.location.city}, ${data.location.country}`;
        } else {
          throw new Error(data.error || "Save failed");
        }
      } catch (err) {
        console.error("Location error:", err);
        statusEl.textContent = "❌ Failed to save location";
      }
    });
  }

  // 🌎 GPS Location Save
  if (useCurrentBtn) {
    useCurrentBtn.addEventListener("click", () => {
      console.log("🌐 Location Button clicked");
      if (!navigator.geolocation) {
        return alert("Geolocation is not supported by your browser.");
      }

      useCurrentBtn.disabled = true;
      statusEl.textContent = "📡 Locating...";

      navigator.geolocation.getCurrentPosition(
        async (position) => {
          const { latitude, longitude } = position.coords;

          try {
            const res = await fetch("/location/save", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ latitude, longitude }),
            });

            const data = await res.json();
            if (data.success) {
              statusEl.textContent = `✅ Location set to ${data.location.city}, ${data.location.country}`;
            } else {
              throw new Error(data.error || "Reverse geocoding failed");
            }
          } catch (err) {
            console.error("Geolocation error:", err);
            statusEl.textContent = "❌ Could not set location";
          }

          useCurrentBtn.disabled = false;
        },
        (err) => {
          console.error("Geolocation failed:", err);
          alert("Could not get your location.");
          statusEl.textContent = "❌ Location access denied";
          useCurrentBtn.disabled = false;
        }
      );
    });
  }
});
