// ====== Initial Count Setup ======
console.log("Loaded notifications:", window.notifications || []);
const unread = (window.notifications || []).filter((n) => !n.read);
let unreadCount = unread.length;

console.log("Unread count:", unreadCount);

// ====== Badge Handling ======
function updateBadge() {
  const badge = document.getElementById("notification-badge");
  console.log("Badge element:", badge);
  if (!badge) return;

  badge.innerText = unreadCount;
  badge.style.display = unreadCount > 0 ? "flex" : "none";
}

// ====== Toast Handler ======
function showToast(message) {
  const container = document.getElementById("toast-container");
  const toast = document.createElement("div");
  toast.innerText = message;
  toast.style.background = "#333";
  toast.style.color = "#fff";
  toast.style.padding = "12px 16px";
  toast.style.marginTop = "8px";
  toast.style.borderRadius = "4px";
  toast.style.boxShadow = "0 4px 8px rgba(0, 0, 0, 0.2)";
  toast.style.opacity = "0";
  toast.style.transition = "opacity 0.3s ease";

  container.appendChild(toast);
  requestAnimationFrame(() => (toast.style.opacity = "1"));

  setTimeout(() => {
    toast.style.opacity = "0";
    setTimeout(() => toast.remove(), 300);
  }, 4000);
}

// ====== Socket Listener ======
const appSocket = window.appSocket;
appSocket?.on("notification", (data) => {
  showToast(data.message);
  console.log("📩 Notification received!");

  unreadCount++;
  updateBadge();
});

// ====== Reset on Click ======
document.getElementById("alerts")?.addEventListener("click", () => {
  unreadCount = 0;
  updateBadge();
});

// Initial draw of badge
updateBadge();
