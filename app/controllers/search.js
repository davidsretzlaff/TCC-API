const express = require('express');
const authMiddleware = require('../middlewares/auth')
const router = express.Router();
var mongoose = require('mongoose');
var Search = require('../models/search')

//router.use(authMiddleware);

router.get('/',authMiddleware, function (req, res, next) {
    Search.find(function (err, search) {
    if (err) {
      res.status(500).send(err);
    }
    else
      res.json(search);
  });
});

module.exports = app => app.use('/search', router);
