// ===========================
// Hamburger Menu Toggle Logic
// ===========================
document.addEventListener("DOMContentLoaded", () => {
  const menuToggle = document.getElementById("menu-toggle");
  const drawerNav = document.getElementById("drawer-nav");

  function toggleDrawer() {
    drawerNav.classList.toggle("visible");
  }

  if (menuToggle && drawerNav) {
    // Click toggle
    menuToggle.addEventListener("click", toggleDrawer);

    // Keyboard toggle (Enter or Space)
    menuToggle.addEventListener("keydown", (e) => {
      if (e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        toggleDrawer();
      }
    });

    // Click outside to close
    document.addEventListener("click", (e) => {
      if (
        drawerNav.classList.contains("visible") &&
        !drawerNav.contains(e.target) &&
        !menuToggle.contains(e.target)
      ) {
        drawerNav.classList.remove("visible");
      }
    });

    // ESC key to close
    document.addEventListener("keydown", (e) => {
      if (e.key === "Escape") {
        drawerNav.classList.remove("visible");
      }
    });
  }
});
