document.addEventListener("DOMContentLoaded", () => {
  document.querySelectorAll(".translate-btn").forEach((button) => {
    button.addEventListener("click", async () => {
      const messageId = button.dataset.messageId;
      console.log("Translate button clicked for message:", messageId);

      const textElement = document.getElementById(`msg-${messageId}`);
      if (!textElement) {
        console.error(`Could not find element with id msg-${messageId}`);
        return;
      }

      const originalText = textElement.innerText;
      console.log("Original text:", originalText);

      const targetLang = window.targetLanguage || "en";

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
        console.log("Sending fetch...");
        const res = await fetch("/api/translate", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            text: originalText,
            targetLang: targetLang,
          }),
        });

        console.log("Fetch sent, awaiting response...");
        const data = await res.json();
        console.log("Translated response:", data);

        if (data.error || !data.translated) {
          throw new Error(data.error || "Invalid response");
        }

        const translatedText = data.translated;
        const flagLabel = languageMap[targetLang] || targetLang.toUpperCase();

        // Check if translation already exists for this message
        const existing = textElement.parentNode.querySelector(
          `.translated-text[data-id="${messageId}"]`
        );

        if (!existing) {
          const translatedDiv = document.createElement("div");
          translatedDiv.innerText = `[${flagLabel}] ${translatedText}`;
          translatedDiv.classList.add("translated-text");
          translatedDiv.setAttribute("data-id", messageId); // so we can check later
          textElement.parentNode.appendChild(translatedDiv);
        }

        button.disabled = true;
        button.innerText = "✓ Translated";
      } catch (err) {
        console.error("Translation error:", err);
        alert("⚠️ Failed to translate message.");
      }
    });
  });
});
