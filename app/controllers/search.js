const express = require('express');
const authMiddleware = require('../middlewares/auth')
const router = express.Router();
var mongoose = require('mongoose');
var Search = require('../models/search')

//router.use(authMiddleware);
// CORS MIDDLEWARE
router.use((req,res,next)=>{
  // Origin of access control / CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  // Request methods you wish to allow
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS, PUT, PATCH, DELETE');
  // Request headers you wish to allow
  res.setHeader('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Authorization, Accept, Access-Control-Request-Method, Access-Control-Request-Headers, Access-Control-Allow-Credentials');
  // Set to true if you need the website to include cookies in the requests sent
  // to the API (e.g. in case you use sessions)
  res.setHeader('Access-Control-Allow-Credentials', true);
  // Pass to next layer of middleware
  next();
});
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
