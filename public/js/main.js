// ===========================
// Hamburger Menu Toggle Logic
// ===========================
document.addEventListener("DOMContentLoaded", () => {
  const menuToggle = document.getElementById("menu-toggle");
  const drawerNav = document.getElementById("drawer-nav");

  if (menuToggle && drawerNav) {
    menuToggle.addEventListener("click", () => {
      drawerNav.classList.toggle("visible");
    });

    document.addEventListener("click", (e) => {
      if (
        drawerNav.classList.contains("visible") &&
        !drawerNav.contains(e.target) &&
        !menuToggle.contains(e.target)
      ) {
        drawerNav.classList.remove("visible");
      }
    });

    document.addEventListener("keydown", (e) => {
      if (e.key === "Escape") {
        drawerNav.classList.remove("visible");
      }
    });
  }
});
