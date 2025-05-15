// public/js/messages.js

let isTranslating = false;

document.addEventListener("DOMContentLoaded", () => {
  // ===============================
  // 🔻 Scroll to Bottom on Page Load
  // ===============================
  const scrollToBottom = () => {
    const thread = document.querySelector(".messages-thread");
    if (thread) thread.scrollTop = thread.scrollHeight;
  };
  scrollToBottom();

  // =====================================
  // 🔁 Polling Logic to Refresh Messages
  // =====================================
  const refreshMessages = async () => {
    if (isTranslating) return; // ⛔ Prevent refresh during translation

    const path = window.location.pathname;
    const thread = document.querySelector(".messages-thread");
    if (!thread) return;

    try {
      const response = await fetch(path, {
        headers: { "X-Requested-With": "XMLHttpRequest" },
      });
      const html = await response.text();
      const parser = new DOMParser();
      const doc = parser.parseFromString(html, "text/html");
      const newThread = doc.querySelector(".messages-thread");

      if (newThread && thread.innerHTML !== newThread.innerHTML) {
        thread.innerHTML = newThread.innerHTML;
        scrollToBottom();
        attachTranslateListeners(); // ✅ Re-attach after refresh
      }
    } catch (err) {
      console.error("Failed to refresh messages:", err);
    }
  };

  setInterval(refreshMessages, 5000); // 🔁 Every 5s

  // ======================================
  // 🌍 Translation Button Listener Binder
  // ======================================
  function attachTranslateListeners() {
    document.querySelectorAll(".translate-btn").forEach((button) => {
      button.addEventListener("click", async () => {
        const messageId = button.dataset.messageId;
        const textElement = document.getElementById(`msg-${messageId}`);
        if (!textElement) return;

        const originalText = textElement.innerText;

        // ✅ Use injected values from layout.ejs
        const sourceLang = window.sourceLanguage || "en";
        const targetLang = window.targetLanguage || "es";

        const languageMap = {
          en: "🇺🇸 English",
          es: "🇪🇸 Spanish",
          fr: "🇫🇷 French",
          fa: "🇮🇷 Farsi",
          de: "🇩🇪 German",
          it: "🇮🇹 Italian",
          zh: "🇨🇳 Chinese",
          ar: "🇸🇦 Arabic",
          ru: "🇷🇺 Russian",
        };

        try {
          const res = await fetch("/api/translate", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              text: originalText,
              sourceLang,
              targetLang,
            }),
          });

          const data = await res.json();
          if (!data.translated) {
            throw new Error(data.error || "Translation failed");
          }

          const translatedText = data.translated;
          const flagLabel = languageMap[targetLang] || targetLang.toUpperCase();

          const existing = textElement.parentNode.querySelector(
            `.translated-text[data-id="${messageId}"]`
          );
          if (!existing) {
            const translatedDiv = document.createElement("div");
            translatedDiv.innerText = `[${flagLabel}] ${translatedText}`;
            translatedDiv.classList.add("translated-text");
            translatedDiv.setAttribute("data-id", messageId);
            textElement.parentNode.appendChild(translatedDiv);
          }

          button.disabled = true;
          button.innerText = "✓ Translated with AI";
        } catch (err) {
          console.error("❌ Translation error:", err);
          alert("⚠️ Failed to translate message.");
        }
      });
    });
  }

  // 🔁 Bind initial translation listeners on load
  attachTranslateListeners();
});
