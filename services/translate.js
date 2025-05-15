const fetch = require("node-fetch");
const modelMap = require("../config/translationModels");
const HF_API_KEY = process.env.HF_API_KEY;

const HF_MODEL_MAP = {
  es: "Helsinki-NLP/opus-mt-en-es", // Spanish
  fr: "Helsinki-NLP/opus-mt-en-fr", // French
  de: "Helsinki-NLP/opus-mt-en-de", // German
  it: "Helsinki-NLP/opus-mt-en-it", // Italian
  zh: "Helsinki-NLP/opus-mt-en-zh", // Chinese
  ar: "Helsinki-NLP/opus-mt-en-ar", // Arabic
  ru: "Helsinki-NLP/opus-mt-en-ru", // Russian
  fa: "Helsinki-NLP/opus-mt-en-fa", // Farsi (Persian)
};

async function translateText(text, sourceLang = "en", targetLang = "es") {
  if (sourceLang === targetLang) {
    console.log(
      "⚠️ Skipping translation: source and target languages are the same."
    );
    return text;
  }

  const modelKey = `${sourceLang}-${targetLang}`;
  const model = HF_MODEL_MAP[targetLang];

  if (!model) throw new Error(`No model available for language: ${targetLang}`);

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
