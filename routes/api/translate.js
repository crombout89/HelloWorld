// routes/api/translate.js
const express = require("express");
const router = express.Router();
const { translateText } = require("../../services/translate");

router.post("/", async (req, res) => {
  const { text, targetLang } = req.body;
  console.log("✅ /api/translate hit:", { text, targetLang });

  if (!text || !targetLang) {
    return res.status(400).json({ error: "Missing text or targetLang" });
  }

  try {
    const translated = await translateText(text, "en", targetLang);

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