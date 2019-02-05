const express = require('express');
const asyncHandler = require('express-async-handler');
const Pet = require('../models/pet');

const router = express.Router();

/* GET home page. */
router.get('/', asyncHandler(async (req, res) => {
  const page = req.query.page || 1;

  const results = await Pet.paginate({}, { page });

  const body = {
    pets: results.docs,
    pagesCount: results.pages,
    currentPage: page,
  };

  res.format({
    html() {
      res.render('pets-index', {
        pets: results.docs,
        pagesCount: results.pages,
        currentPage: page,
      });
    },
    json() {
      res.json(body);
    },
  });
}));

router.use('/pets', require('./pets'));

module.exports = router;
