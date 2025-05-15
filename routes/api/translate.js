// routes/api/translate.js
const express = require("express");
const router = express.Router();
const { translateText } = require("../../services/translate");

router.post("/", async (req, res) => {
  const { text, sourceLang, targetLang } = req.body;
  console.log("✅ /api/translate hit:", { text, sourceLang, targetLang });

  if (!text || !targetLang || !sourceLang) {
    return res.status(400).json({ error: "Missing required fields" });
  }

  try {
    const translated = await translateText(text, sourceLang, targetLang);

    if (!translated) {
      return res.status(500).json({ error: "Translation failed" });
    }

    res.json({ translated });
  } catch (err) {
    console.error("Translation error:", err);
    res.status(500).json({ error: "Translation failed" });
  }
});

module.exports = router;