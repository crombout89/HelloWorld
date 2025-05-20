document.addEventListener("DOMContentLoaded", () => {
  const menuToggle = document.getElementById("menu-toggle");
  const drawerNav = document.getElementById("drawer-nav");

  if (menuToggle && drawerNav) {
    menuToggle.addEventListener("click", () => {
      drawerNav.style.display =
        drawerNav.style.display === "block" ? "none" : "block";
    });

    // Optional: click outside to close
    document.addEventListener("click", (e) => {
      if (
        drawerNav.style.display === "block" &&
        !drawerNav.contains(e.target) &&
        !menuToggle.contains(e.target)
      ) {
        drawerNav.style.display = "none";
      }
    });

    // Optional: ESC key to close
    document.addEventListener("keydown", (e) => {
      if (e.key === "Escape") {
        drawerNav.style.display = "none";
      }
    });
  }
});
