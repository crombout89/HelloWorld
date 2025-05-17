// public/js/modal.js
function openModal(content) {
  const modal = document.getElementById("global-modal");
  const body = document.getElementById("modal-body");

  body.innerHTML = content;
  modal.classList.remove("inactive", "animate__fadeOut");
  modal.classList.add("animate__animated", "animate__fadeIn");

  // Re-bind close button click listener
  const closeBtn = modal.querySelector(".modal-close");
  if (closeBtn) {
    closeBtn.addEventListener("click", closeModal);
  }
}

function openModalFromURL(url) {
  fetch(url)
    .then((res) => res.text())
    .then((html) => openModal(html))
    .catch((err) => {
      openModal(`<p class="error">Failed to load modal content.</p>`);
      console.error(err);
    });
}

function closeModal() {
  const modal = document.getElementById("global-modal");

  modal.classList.remove("animate__fadeIn");
  modal.classList.add("animate__fadeOut");

  modal.addEventListener(
    "animationend",
    () => {
      modal.classList.add("inactive");
      modal.classList.remove("animate__animated", "animate__fadeOut");
      document.getElementById("modal-body").innerHTML = "";
    },
    { once: true }
  );
}