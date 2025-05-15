const fetch = require("node-fetch");

const HF_API_KEY = process.env.HF_API_KEY;

// Construct the model URL dynamically
function getModelUrl(sourceLang, targetLang) {
  return `https://api-inference.huggingface.co/models/Helsinki-NLP/opus-mt-${sourceLang}-${targetLang}`;
}

async function translateText(text, sourceLang = "en", targetLang = "fr") {
  const url = getModelUrl(sourceLang, targetLang);

  try {
    const response = await fetch(url, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${HF_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ inputs: text }),
    });

    const raw = await response.text();
    console.log("🌐 HuggingFace response:", raw);

    const result = JSON.parse(raw);

    // Expected: [{ translation_text: "..." }]
    if (Array.isArray(result) && result[0]?.translation_text) {
      return result[0].translation_text;
    }

    throw new Error("Unexpected API response format");
  } catch (err) {
    console.error("❌ Translation error:", err.message);
    return null;
  }
}

module.exports = { translateText };
