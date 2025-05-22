// ===========================
// Drawer Nav Toggle
// ===========================
function initDrawerToggle() {
  const menuToggle = document.getElementById("menu-toggle");
  const drawerNav = document.getElementById("drawer-nav");
  const iconMenu = document.querySelector(".icon-menu");
  const iconClose = document.querySelector(".icon-close");

  function toggleDrawer() {
    const isOpen = drawerNav.classList.toggle("visible");

    if (iconMenu && iconClose) {
      iconMenu.style.display = isOpen ? "none" : "block";
      iconClose.style.display = isOpen ? "block" : "none";
    }
  }

  if (menuToggle && drawerNav) {
    menuToggle.addEventListener("click", toggleDrawer);

    menuToggle.addEventListener("keydown", (e) => {
      if (e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        toggleDrawer();
      }
    });

    document.addEventListener("click", (e) => {
      if (
        drawerNav.classList.contains("visible") &&
        !drawerNav.contains(e.target) &&
        !menuToggle.contains(e.target)
      ) {
        drawerNav.classList.remove("visible");
        iconMenu.style.display = "block";
        iconClose.style.display = "none";
      }
    });

    document.addEventListener("keydown", (e) => {
      if (e.key === "Escape") {
        drawerNav.classList.remove("visible");
        iconMenu.style.display = "block";
        iconClose.style.display = "none";
      }
    });
  }
}

// ===========================
// Init All on DOM Load
// ===========================
document.addEventListener("DOMContentLoaded", () => {
  initDrawerToggle();
});
