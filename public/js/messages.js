document.addEventListener('DOMContentLoaded', () => {
  document.querySelectorAll('.translate-btn').forEach(button => {
    button.addEventListener('click', async () => {
      const messageId = button.dataset.messageId;
      console.log('Translate button clicked for message:', messageId);

      const textElement = document.getElementById(`msg-${messageId}`);
      if (!textElement) {
        console.error(`Could not find element with id msg-${messageId}`);
        return;
      }

      const originalText = textElement.innerText;
      console.log('Original text:', originalText);

      const targetLang = 'en'; // Hardcoded for now

      try {
        console.log('Sending fetch...');
        const res = await fetch('http://localhost:3000/api/translate', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            text: originalText,
            targetLang: targetLang
          })
        });

        console.log('Fetch sent, awaiting response...');
        console.log('Response status:', res.status);

        const data = await res.json();
        console.log('Translated response:', data);

        if (data.error || !data.translated) {
          throw new Error(data.error || 'Invalid response');
        }

        const translatedText = data.translated;

        const translatedDiv = document.createElement('div');
        translatedDiv.innerText = `[Translated] ${translatedText}`;
        translatedDiv.classList.add('translated-text');

        textElement.parentNode.appendChild(translatedDiv);
      } catch (err) {
        console.error('Translation error:', err);
        alert('⚠️ Failed to translate message.');
      }
    });
  });
});