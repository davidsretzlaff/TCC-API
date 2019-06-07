var express = require('express');
var router = express.Router();
var mongoose = require('mongoose');
var Ingredient = require('../models/ingredientsAnimalOrigin')
const authMiddleware = require('../middlewares/auth')

// CORS MIDDLEWARE
router.use((req, res, next) => {
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

/* GET produtos listing. */
router.get('/', function (req, res, next) {
  Ingredient.find(function (err, ingredients) {
    if (err) {
      res.status(500).send(err);
    }
    else
      res.json(ingredients);
  });
});

/* GET produtos by id listing. */
router.get('/:id', function (req, res, next) {
  console.log("search product to id", req.params.id)
  const { id } = req.params;

  if (id == undefined)
    return res.status(400).send({ status: "error", error: "need to pass id " });

  if (!id.match(/^[0-9a-fA-F]{24}$/))
    return res.status(400).send({ status: "error", error: "Wrong id format" });

  Ingredient.findById(req.params.id, function (error, ingredients) {
    if (error)
      res.send(error);

  }).then(ingredients => {
    if (!ingredients)
      return res.status(400).send({ status: "error", error: "ingredients not found" });
    res.status(200).send(ingredients);
  }).catch(e => {
    return res.status(400).send({ error: "Error" });
  })
});

/*  GET product by name */
router.get('/name/:name', function (req, res, next) {
  console.log("search product to name", req.params.name)
  const { name } = req.params;
  if (name == undefined || name.length < 3)
    return res.status(400).send({ status: "error", error: "needs at least 3 characters" });

  Ingredient.find({
    name: { "$regex": name, "$options": "i" },
  }).then(data => {
    if (data.length == 0)
      return res.status(400).send({ status: "error", error: "ingredients not found" });

    res.status(200).send(data);
  }).catch(e => {
    return res.status(400).send({ error: "Error" });
  })
});

/* POST product */
router.post('/', async (req, res) => {
  const { name, email, password } = req.body;

  if (email == undefined || password == undefined)
    return res.status(400).send({ error: "Need email and password for authentication " });

  if (!await checkPermission(email))
    return res.status(400).send({ error: "Permission denied" })

  console.log("POST");

  if (!name) {
    return res.status(400).send({ status: "error", error: "name is required" });
  }

  if (await Ingredient.findOne({ name })) {
    return res.status(400).send({ status: "error", error: "Ingredient already exist" });
  }

  var ingredient = new Ingredient();
  ingredient._id = new mongoose.Types.ObjectId(),
    ingredient.name = name;

  ingredient.save(function (error) {
    if (error)
      res.status(500).send(error);

    res.sendStatus(201);
  });
});

/* put produtos listing. */
router.put('/:id', async function (req, res, next) {
  const { name, email, password } = req.body;

  if (email == undefined || password == undefined)
    return res.status(400).send({ error: "Need email and password for authentication " });

  if (!await checkPermission(email))
    return res.status(400).send({ error: "Permission denied" })

  console.log("PUT ", req.params.id);

  const { id } = req.params;

  if (id == undefined)
    return res.status(400).send({ status: "error", error: "Need to pass id " });

  if (!id.match(/^[0-9a-fA-F]{24}$/))
    return res.status(400).send({ status: "error", error: "Wrong id format" });

  if (name == undefined)
    return res.status(400).send({ status: "error", error: "Unfilled name" });

  Ingredient.findById(id, function (error, ingredient) {
    if (error)
      res.send(error);
    if (!ingredient)
      return res.status(200).json({ status: "error", message: 'Ingredient not found' });

    ingredient.name = name;
    ingredient.save(function (error) {
      if (error)
        res.send(error);
      res.sendStatus(200);
    });
  });
});
/* DELETE product listing. */
router.delete('/:id', async (req, res) => {
  const { email, password } = req.body;

  if (email == undefined || password == undefined)
    return res.status(400).send({ error: "Need email and password for authentication " });


  if (!await checkPermission(email))
    return res.status(400).send({ error: "Permission denied" })

  console.log("Delete ", req.params.id);
  const { id } = req.params;

  if (id == undefined)
    return res.status(400).send({ error: "need to pass id " });

  if (!id.match(/^[0-9a-fA-F]{24}$/))
    return res.status(400).send({ error: "Wrong id format" });

  Ingredient.remove({ _id: req.params.id }, (err, ingredient) => {
    if (err) {
      res.status(500).send({ status: "error", message: err });
      return;
    }
    if (ingredient.n > 0) {
      res.status(200).json({ status: "success", message: 'Ingredient deleted!' });
    } else {
      res.status(200).json({ status: "error", message: 'Ingredient not found' });
    }

  });
});

module.exports = app => app.use('/ingredientsAnimalOrigin', router);
