const asyncHandler = require('express-async-handler');
const Pet = require('../models/pet');

module.exports = (app) => {
  /* GET home page. */
  app.get('/', asyncHandler(async (req, res) => {
    const page = req.query.page || 1;

    const results = await Pet.paginate({}, { page });

    res.render('pets-index', { pets: results.docs, pagesCount: results.pages, currentPage: page });
  }));
}
