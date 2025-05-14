// middleware/auth.js

function isLoggedIn(req, res, next) {
  if (req.session?.user && req.session?.userId) {
    return next();
  }
  return res.redirect("/login");
}

module.exports = { isLoggedIn };
