const express = require('express');
const router = express.Router();

class IndexController {
  getIndex(req, res) {
    res.render('index', { title: 'HelloWorld.app' });
  }
}

const indexController = new IndexController();
router.get('/', indexController.getIndex);

module.exports = router;