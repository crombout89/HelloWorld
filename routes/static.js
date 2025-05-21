const express = require("express");
const router = express.Router();

router.get("/about", (req, res) => {
  res.render("static/about", { title: "About" });
});

router.get("/faq", (req, res) => {
  res.render("static/faq", { title: "Help / FAQ" });
});

module.exports = router;
