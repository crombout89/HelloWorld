document.addEventListener('DOMContentLoaded', () => {
  document.querySelectorAll('.translate-btn').forEach(button => {
    button.addEventListener('click', async () => {
      const messageId = button.dataset.messageId;
      const textElement = document.getElementById(`msg-${messageId}`);
      const originalText = textElement.innerText;
      const targetLang = 'English'; // or get from dropdown/user setting

      try {
        const res = await fetch('/api/translate', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            text: originalText,
            targetLang: targetLang
          })
        });

        const data = await res.json();
        const translatedText = data.translated;

        const translatedDiv = document.createElement('div');
        translatedDiv.innerText = `[Translated] ${translatedText}`;
        translatedDiv.classList.add('translated-text');

        textElement.parentNode.appendChild(translatedDiv);
      } catch (err) {
        console.error('Translation error:', err);
        alert('Failed to translate message');
      }
    });
  });
});