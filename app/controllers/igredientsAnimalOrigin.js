var express = require('express');
var router = express.Router();
var mongoose = require('mongoose');
var Ingredient = require('../models/ingredientsAnimalOrigin')
//const authMiddleware = require('../middlewares/auth')

//router.use(authMiddleware);
/* GET produtos listing. */
router.get('/', function(req, res, next) {
    Ingredient.find(function(err,ingredients) {
    if(err){
        res.status(500).send(err);
    }
    else
        res.json(ingredients);
  });
});

/* GET produtos by id listing. */
router.get('/:id', function(req, res, next) {
  console.log("search product to id",req.params.id)
  const{ id } = req.params;

if(id == undefined )
  return res.status(400).send({status: "error", error: "need to pass id " });

if (!id.match(/^[0-9a-fA-F]{24}$/)) 
  return res.status(400).send({status: "error", error: "Wrong id format" });

  Ingredient.findById(req.params.id, function(error, ingredients) {
    if(error) 
      res.send(error);

  }).then(ingredients => {
    if(!ingredients)
      return res.status(400).send({status: "error", error: "Product not found" });
    res.status(200).send(ingredients);
  }).catch(e => {
    return res.status(400).send({ error: "Error" });
  })
});

/*  GET product by name */
router.get('/nameEnglish/:name', function(req, res, next) {
  console.log("search product to name",req.params.name)
  const{ name } = req.params;
  if(name == undefined || name.length < 3)
    return res.status(400).send({ status: "error",error: "needs at least 3 characters" });

  Ingredient.find({
    namePortuguese:  { "$regex": name, "$options": "i" },
  }).then(data => {
    if(data.length == 0)
      return res.status(400).send({status: "error", error: "Product not found" });

    res.status(200).send(data);
  }).catch(e => {
    return res.status(400).send({ error: "Error" });
  })
});


/*  GET product by barcode */
router.get('/NameEnglish/:name', function(req, res, next) {
    console.log("search product to name",req.params.name)
    const{ name } = req.params;
    if(name == undefined || name.length < 3)
      return res.status(400).send({ status: "error",error: "needs at least 3 characters" });
  
    Ingredient.find({
      nameEnglish:  { "$regex": name, "$options": "i" },
    }).then(data => {
      if(data.length == 0)
        return res.status(400).send({status: "error", error: "Ingredient not found" });
  
      res.status(200).send(data);
    }).catch(e => {
      return res.status(400).send({ error: "Error" });
    })
});

/* POST product */
router.post('/', async (req, res) => {
  console.log("POST");
  const nameEnglish = req.body.nameEnglish;
  const namePortuguese = req.body.namePortuguese;

  if(!nameEnglish)
  {
    return res.status(400).send({status: "error", error: "name is required" });
  }

  if(!namePortuguese)
  {
    return res.status(400).send({status: "error", error: "name is required" });
  }

  if(await Ingredient.findOne({namePortuguese}))
  {
    return res.status(400).send({status: "error", error: "Ingredient already exist" });
  }

  if(await Ingredient.findOne({nameEnglish}))
  {
    return res.status(400).send({status: "error", error: "Ingredient already exist" });
  }

    var ingredient = new Ingredient();
    ingredient._id = new mongoose.Types.ObjectId(),
    ingredient.nameEnglish = nameEnglish;
    ingredient.namePortuguese = namePortuguese;
    
    ingredient.save(function(error) {
      if(error)
        res.status(500).send(error);
                        
      res.sendStatus(201);
    });
  });

/* put produtos listing. */
router.put('/:id', function(req, res, next) {
  console.log("PUT ", req.params.id);
  const nameEnglish = req.body.nameEnglish;
  const namePortuguese = req.body.namePortuguese;
  
  const{ id } = req.params;

  if(id == undefined )
    return res.status(400).send({status: "error", error: "need to pass id " });
  
  if (!id.match(/^[0-9a-fA-F]{24}$/)) 
    return res.status(400).send({status: "error", error: "Wrong id format" });

  Ingredient.findById(id, function(error, ingredient) {
    if(error) 
      res.send(error);    
    if(!ingredient)
      return res.status(200).json({status: "error", message: 'Ingredient not found' });
      
    ingredient.nameEnglish = nameEnglish;
    ingredient.namePortuguese = namePortuguese;

    ingredient.save(function(error) {
    if(error)
      res.send(error);
    //Se não teve erro, retorna response normal (200)
    res.sendStatus(200);
  });
  });
});
/* DELETE product listing. */
router.delete('/:id',  async (req, res) => {
  console.log("Delete ", req.params.id);
  const{ id } = req.params;

  if(id == undefined )
    return res.status(400).send({ error: "need to pass id " });
  
  if (!id.match(/^[0-9a-fA-F]{24}$/)) 
    return res.status(400).send({ error: "Wrong id format" });

  Ingredient.remove({_id: req.params.id}, (err, ingredient) => {
    if (err) {
        res.status(500).send({status: "error", message: err});
        return;
    }
    if(ingredient.n > 0){
        res.status(200).json({status: "success", message: 'Ingredient deleted!' });
    }else{
        res.status(200).json({status: "error", message: 'Ingredient not found' });
    }
    
});
});
        
module.exports = app => app.use('/ingredientsAnimalOrigin', router);
