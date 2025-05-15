const fetch = require("node-fetch");
const modelMap = require("../config/translationModels");
const HF_API_KEY = process.env.HF_API_KEY;

async function translateText(text, sourceLang = "en", targetLang = "fr") {
  const model = modelMap[targetLang];

  if (!model) {
    throw new Error(`No model available for language: ${targetLang}`);
  }

  const url = `https://api-inference.huggingface.co/models/${model}`;

  try {
    const response = await fetch(url, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${HF_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ inputs: text }),
    });

    const result = await response.json();

    if (Array.isArray(result) && result[0]?.translation_text) {
      return result[0].translation_text;
    }

    throw new Error("Unexpected response from translation API");
  } catch (error) {
    console.error("Translation error:", error.message);
    return null;
  }
}

module.exports = { translateText };
