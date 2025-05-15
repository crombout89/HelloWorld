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

// ====== Toast Notification Handler ======
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

// ====== Socket Listener (Real-Time Notifications) ======
const appSocket = window.appSocket;
appSocket?.on("notification", (data) => {
  showToast(data.message);
  console.log("📩 Notification received!");

  unreadCount++;
  updateBadge();
});

// ====== Modal Functions ======
function openModal(contentHtml) {
  const modal = document.getElementById("generic-modal");
  if (!modal) return;

  const body = modal.querySelector(".modal-body");
  body.innerHTML = contentHtml;

  modal.classList.add("show");
  modal.style.display = "block";

  const close = modal.querySelector(".modal-close");
  close?.addEventListener("click", closeModal);
}

function closeModal() {
  const modal = document.getElementById("generic-modal");
  modal.classList.remove("show");
  modal.style.display = "none";
}

// ====== Handle Invite Notification Button Click ======
document.querySelectorAll(".open-invite-modal")?.forEach((button) => {
  button.addEventListener("click", async () => {
    const notificationId = button.dataset.notificationId;
    const message = button.dataset.message;
    const link = button.dataset.link;

    // ✅ Attempt to mark notification as read
    try {
      const res = await fetch(`/notifications/mark-read/${notificationId}`, {
        method: "POST",
      });

      if (res.ok) {
        // Remove from DOM
        const row = document.getElementById(`notif-${notificationId}`);
        if (row) row.remove();

        // Decrease badge count
        unreadCount = Math.max(unreadCount - 1, 0);
        updateBadge();
      } else {
        console.error("❌ Failed to mark notification as read.");
      }
    } catch (err) {
      console.error("⚠️ Error marking notification as read:", err);
    }

    // 📨 Show invitation modal
    const html = `
      <p>${message}</p>
      <div class="modal-actions">
        <form action="${link}/accept" method="POST" style="display: inline;">
          <input type="hidden" name="notificationId" value="${notificationId}">
          <button class="btn-accept" type="submit">Accept</button>
        </form>
        <form action="${link}/decline" method="POST" style="display: inline;">
          <input type="hidden" name="notificationId" value="${notificationId}">
          <button class="btn-decline" type="submit">Decline</button>
        </form>
      </div>
    `;

    openModal(html);
  });
});

// ====== Draw Badge on Load ======
updateBadge();
