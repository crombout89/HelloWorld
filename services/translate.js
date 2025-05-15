// services/translate.js
const fetch = require("node-fetch");

const HF_API_URL =
  "https://api-inference.huggingface.co/models/deepseek-ai/deepseek-moe-translate";
const HF_API_KEY = process.env.HF_API_KEY;

async function translateText(text, sourceLang = "en", targetLang = "fr") {
  try {
    const response = await fetch(
      "https://api-inference.huggingface.co/models/Helsinki-NLP/opus-mt-en-ROMANCE",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${process.env.HF_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ inputs: text }),
      }
    );

    const result = await response.json();

    if (Array.isArray(result) && result[0]?.translation_text) {
      return result[0].translation_text;
    }

    throw new Error("Unexpected API response format");
  } catch (error) {
    console.error("Translation error:", error.message);
    return null;
  }
}

module.exports = { translateText };
