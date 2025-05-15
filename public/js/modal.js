// public/js/modal.js
function showModal(contentHtml) {
  let modal = document.getElementById("app-modal");

  if (!modal) {
    modal = document.createElement("div");
    modal.id = "app-modal";
    modal.className = "modal-backdrop";
    modal.innerHTML = `
        <div class="modal">
          <div class="modal-content" id="modal-content"></div>
          <button id="modal-close" class="modal-close">×</button>
        </div>
      `;
    document.body.appendChild(modal);

    modal.querySelector("#modal-close").addEventListener("click", () => {
      modal.remove();
    });
  }

  modal.querySelector("#modal-content").innerHTML = contentHtml;
  modal.style.display = "flex";
}
