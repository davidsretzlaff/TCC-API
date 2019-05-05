const express = require('express');
const authMiddleware = require('../middlewares/auth')
const router = express.Router();
var mongoose = require('mongoose');
var Brand = require('../models/brand')

router.use(authMiddleware);

/* GET produtos listing. */
router.get('/', function(req, res, next) {
  Brand.find(function(err,brands) {
    if(err){
        res.status(500).send(err);
    }
    else
        res.json(brands);
  });
});
/* GET marca by id listing. */
router.get('/:id', function(req, res, next) {
  console.log("Buscar produto por id",req.params.id)
  Brand.findById(req.params.id, function(error, brand) {
    if(error) 
      res.send(error);
    res.json(brand);
  });
});
/* POST brand */
router.post('/', async (req, res, ) =>{
  console.log("POST");
  var name = req.body.name;
  if(await Brand.findOne({name}))
  {
    return res.status(400).send({ error: "brand already exist" });
  }
    var brand = new Brand();
    brand._id = new mongoose.Types.ObjectId(),
    brand.name = req.body.name;
    brand.description = req.body.description;
    brand.isVegan = req.body.isVegan;
    brand.isCrueltyFree = req.body.isCrueltyFree;
    brand.ative = req.body.ative;
    brand.save(function(error) {
      if(error)
        res.status(500).send(err);
                        
      res.sendStatus(201);
    });
  });

router.put('/:id', function(req, res, next) {
  console.log("PUT ", req.params.id);
  Brand.findById(req.params.id, function(error, brand) {
    if(error) 
      res.send(error);    
      brand.name = req.body.name;
      brand.description = req.body.description;
      brand.isVegan = req.body.isVegan;
      brand.isCrueltyFree = req.body.isCrueltyFree;
      brand.ative = req.body.ative;
      brand.save(function(error) {
      if(error)
        res.send(error);
      //Se não teve erro, retorna response normal (200)
      res.sendStatus(200);
    });
  });
});

router.delete('/:id', function(req, res, next) {
  console.log("Delete ", req.params.id);
  Brand.remove({
    _id: req.params.id
  }, function(error) {
    if(error)
      res.send(error);
    //Se não teve erro, retorna response normal (200)
    res.sendStatus(200);
  });
});

module.exports = app => app.use('/brand', router);

