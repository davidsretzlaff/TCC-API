var express = require('express');
var router = express.Router();
var mongoose = require('mongoose');
var Product = require('../models/product')
var Ingredient = require('../models/ingredientsAnimalOrigin')
//const authMiddleware = require('../middlewares/auth')
const multer = require('multer');


const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, './uploads/');
  },
  filename: function (req, file, cb) {
    cb(null, req.body.barcode + file.originalname);
  }
});

const fileFilter = (req, file, cb) => {
  // reject a file
  if (file.mimetype === 'image/jpeg' || file.mimetype === 'image/png') {
    cb(null, true);
  } else {
    cb(null, false);
  }
};

const upload = multer({
  storage: storage,
  limits: {
    fileSize: 1024 * 1024 * 5
  },
  fileFilter: fileFilter
});


//router.use(authMiddleware);
/* GET produtos listing. */
router.get('/', function (req, res, next) {
  Product.find(function (err, products) {
    if (err) {
      res.status(500).send(err);
    }
    else
      res.json(products);
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

  Product.findById(req.params.id, function (error, products) {
    if (error)
      res.send(error);
  }).then(products => {
    if (!products)
      return res.status(400).send({ status: "error", error: "Product not found" });
    res.status(200).send(products);
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

  Product.find({
    active: true,
    name: { "$regex": name, "$options": "i" }
  }).then(data => {
    if (data.length == 0)
      return res.status(400).send({ status: "error", error: "Product not found" });

    res.status(200).send(data);
  }).catch(e => {
    return res.status(400).send({ error: "Error" });
  })
});


/*  GET product by barcode */
router.get('/barcode/:barcode', function (req, res, next) {
  console.log("search product to barcode", req.params.barcode)
  const { barcode } = req.params;
  if (barcode == undefined)
    return res.status(400).send({ status: "error", error: "need to pass barcode" });

  Product.find({
    active: true,
    barcode: barcode
  }).then(data => {
    if (data.length == 0)
      return res.status(400).send({ status: "error", error: "Product not found" });

    res.status(200).send(data);
  }).catch(e => {
    return res.status(400).send({ error: "error" });
  })
});

/* POST product */
router.post('/', upload.single('productImage'), async (req, res) => {
  console.log("POST");
  if (req.file != undefined)
    console.log(req.file);

  var name = req.body.name;

  if (!name) {
    return res.status(400).send({ status: "error", error: "name is required" });
  }

  if (await Product.findOne({ name })) {
    return res.status(400).send({ status: "error", error: "Product already exist" });
  }

  var product = new Product();
  product._id = new mongoose.Types.ObjectId(),
    product.brand = req.body.brand;
  product.name = req.body.name;
  product.description = req.body.description;
  product.isCrueltyFree = req.body.isCrueltyFree;
  product.active = false;
  product.barcode = req.body.barcode;
  product.isCrueltyFreeVerify = false;
  product.isVeganVerify = false;
  product.isVegan = true;
  product.isCrueltyFree = req.body.isCrueltyFree;

  if (req.file.path != undefined)
    product.productImage = req.file.path;

  await asyncForEach(req.body.ingredients, async (element) => {
    product.isVeganVerify = true;
    if (await Ingredient.findOne({ 'nameEnglish': element.nameEnglish })) {
      product.isVegan = false;
      return true;
    }
    if (await Ingredient.findOne({ 'namePortuguese': element.namePortuguese })) {
      product.isVegan = false;
      return true;
    }
  });

  product.ingredients = req.body.ingredients;

  product.save(function (error) {
    if (error)
      res.status(500).send(error);

    res.sendStatus(201);
  });
});



/* put produtos listing. */
router.put('/:id', upload.single('productImage'), async (req, res) => {
  console.log("PUT ", req.params.id);

  const { id } = req.params;

  if (id == undefined)
    return res.status(400).send({ status: "error", error: "need to pass id " });

  if (!id.match(/^[0-9a-fA-F]{24}$/))
    return res.status(400).send({ status: "error", error: "Wrong id format" });

  Product.findById(id, async function (error, product) {
    if (error)
      res.send(error);
    if (!product)
      return res.status(200).json({ status: "error", message: 'product not found' });

    product.name = req.body.name;
    product.description = req.body.description;
    product.isVegan = req.body.isVegan;
    product.isCrueltyFree = req.body.isCrueltyFree;
    product.barcode = req.body.barcode;
    product.active = req.body.active;
    product.isVeganVerify = req.body.isVeganVerify;
    product.isCrueltyFreeVerify = req.body.isCrueltyFreeVerify;

    if(req.body.brand != undefined)
      req.body.brand.name
    
    if (req.file != undefined)
      product.productImage = req.file.path;

    if (req.body.ingredients != undefined) {
      await asyncForEach(req.body.ingredients, async (element) => {
        product.isVeganVerify = true;
        if (await Ingredient.findOne({ 'nameEnglish': element.nameEnglish })) {
          product.isVegan = false;
          return true;
        }
        if (await Ingredient.findOne({ 'namePortuguese': element.namePortuguese })) {
          product.isVegan = false;
          return true;
        }
      });

      product.ingredients = req.body.ingredients;
    }

   

    product.save(function (error) {
      if (error)
        res.send(error);
      //Se não teve erro, retorna response normal (200)
      res.sendStatus(200);
    });
  });
});

async function asyncForEach(array, callback) {
  for (let index = 0; index < array.length; index++) {
    await callback(array[index], index, array);
  }
}
/* DELETE product listing. */
router.delete('/:id', async (req, res) => {
  console.log("Delete ", req.params.id);
  const { id } = req.params;

  if (id == undefined)
    return res.status(400).send({ error: "need to pass id " });

  if (!id.match(/^[0-9a-fA-F]{24}$/))
    return res.status(400).send({ error: "Wrong id format" });

  Product.remove({ _id: req.params.id }, (err, product) => {
    if (err) {
      res.status(500).send({ status: "error", message: err });
      return;
    }
    if (product.n > 0) {
      res.status(200).json({ status: "success", message: 'product deleted!' });
    } else {
      res.status(200).json({ status: "error", message: 'product not found' });
    }

  });
});

module.exports = app => app.use('/product', router);
