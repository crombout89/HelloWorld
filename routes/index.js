const express = require('express');
const router = express.Router();

class IndexController {  // Example using a class for a controller
  getIndex(req, res) {
    res.render('index', { title: 'Express' });
  }
}

const indexController = new IndexController();
router.get('/', indexController.getIndex);

module.exports = router;