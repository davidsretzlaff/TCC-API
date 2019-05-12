const express = require('express');
const authMiddleware = require('../middlewares/auth')
const router = express.Router();
var mongoose = require('mongoose');
var Brand = require('../models/brand')

//router.use(authMiddleware);

/* GET brands listing. */
router.get('/', function (req, res, next) {
  Brand.find({ ative: true }, function (err, brands) {
    if (err) {
      res.status(500).send(err);
    }
    else
      res.json(brands);
  });
});
/* GET marca by pendent listing. */


/* GET produtos by id listing. */
router.get('/:id', function (req, res, next) {
  console.log("search brand to id", req.params.id)
  const { id } = req.params;

  if (id == undefined)
    return res.status(400).send({ status: "error", error: "need to pass id " });

  if (!id.match(/^[0-9a-fA-F]{24}$/))
    return res.status(400).send({ status: "error", error: "Wrong id format" });

  Brand.findById(req.params.id,  function (error, brands) {
    if (error)
      res.send(error);
  }).then(brands => {
    if (!brands)
      return res.status(400).send({ status: "error", error: "Brand not found" });
    res.status(200).send(brands);
  }).catch(e => {
    return res.status(400).send({ error: "Error" });
  })
});

router.get('/name/:name', function (req, res, next) {
  console.log("search brand to name", req.params.name)
  const { name } = req.params;
  if (name == undefined || name.length < 3)
    return res.status(400).send({ status: "error", error: "needs at least 3 characters" });

  Brand.find({
    ative: true,
    name: { "$regex": name, "$options": "i" }
  }).then(data => {
    if (data.length == 0)
      return res.status(400).send({ status: "error", error: "Brand not found" });

    res.status(200).send(data);
  }).catch(e => {
    return res.status(400).send({ error: "Error" });
  })
});



/* POST brand */

  router.post('/',authMiddleware, async (req, res) => {
    console.log("POST");
    if (req.file != undefined)
      console.log(req.file);

    var name = req.body.name;

    if (!name) {
      return res.status(400).send({ status: "error", error: "name is required" });
    }

    if (await Brand.findOne({ name })) {
      return res.status(400).send({ status: "error", error: "Brand already exist" });
    }
    var brand = new Brand();
    brand._id = new mongoose.Types.ObjectId(),
      brand.name = req.body.name;
    brand.description = req.body.description;
    brand.isVegan = req.body.isVegan;
    brand.isCrueltyFree = req.body.isCrueltyFree;
    brand.ative = req.body.ative;
    brand.save(function (error) {
      if (error)
        res.status(500).send(err);

      res.sendStatus(201);
    });
  });



router.put('/:id',authMiddleware, function (req, res, next) {
  console.log("PUT ", req.params.id);

  const { id } = req.params;

  if (id == undefined)
    return res.status(400).send({ status: "error", error: "need to pass id " });

  if (!id.match(/^[0-9a-fA-F]{24}$/))
    return res.status(400).send({ status: "error", error: "Wrong id format" });

  Brand.findById(id, async function (error, brands) {
    if (error)
      res.send(error);
    if (!brands)
      return res.status(200).json({ status: "error", message: 'brand not found' });

    Brand.findById(req.params.id, function (error, brand) {
      if (error)
        res.send(error);

      if (req.body.name != undefined)
        brand.name = req.body.name;
      if (req.body.description != undefined)
        brand.description = req.body.description;
      if (req.body.isVegan != undefined)
        brand.isVegan = req.body.isVegan;
      if (req.body.isCrueltyFree != undefined)
        brand.isCrueltyFree = req.body.isCrueltyFree;
      if (req.body.ative != undefined)
        brand.ative = req.body.ative;
      brand.save(function (error) {
        if (error)
          res.send(error);
        //Se não teve erro, retorna response normal (200)
        res.sendStatus(200);
      });
    });
  });
});
  router.delete('/:id',authMiddleware, async (req, res) => {
    console.log("Delete ", req.params.id);
    const { id } = req.params;

    if (id == undefined)
      return res.status(400).send({ error: "need to pass id " });

    if (!id.match(/^[0-9a-fA-F]{24}$/))
      return res.status(400).send({ error: "Wrong id format" });

    Brand.remove({ _id: req.params.id }, (err, brand) => {
      if (err) {
        res.status(500).send({ status: "error", message: err });
        return;
      }
      if (brand.n > 0) {
        res.status(200).json({ status: "success", message: 'brand deleted!' });
      } else {
        res.status(200).json({ status: "error", message: 'brand not found' });
      }

    });
  });

  module.exports = app => app.use('/brand', router);

