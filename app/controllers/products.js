var express = require('express');
var router = express.Router();

var mongoose = require('mongoose');
var Product = require('../models/product')
var Ingredient = require('../models/ingredientsAnimalOrigin')
var Brand = require('../models/brand')
var User = require('../models/user')
var Search = require('../models/search')
const authMiddleware = require('../middlewares/auth')
const multer = require('multer');

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

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, './uploads/');
  },
  filename: function (req, file, cb) {
    cb(null, new Date().toISOString() + file.originalname);
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
  Product.find({ active: true }, function (err, products) {
    if (err) {
      res.status(500).send(err);
    }
    else
      res.json(products);
  });
});


/*  GET product by pendent */
router.get('/pendent/:pendent', function (req, res, next) {
  console.log("search product to name", req.params.name)
  const { pendent } = req.params;
  if (pendent == undefined)
    return res.status(400).send({ status: "error", error: "needs send value" });

  Product.find({
    active: pendent,
  }).then(data => {
    if (data.length == 0)
      return res.status(400).send({ status: "error", error: "Product not found" });

    res.status(200).send(data);
  }).catch(e => {
    return res.status(400).send({ error: "Error" });
  })
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
    if (data.length == 0) {
      var search = new Search();
      search.name = name;
      search.verify = false;
      search.save(function (error) {
      });
      return res.status(400).send({ status: "error", error: "Product not found" });
    }
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
    if (data.length == 0) {
      var search = new Search();
      search.name = barcode;
      search.verify = false;
      search.save(function (error) {
      });
      return res.status(400).send({ status: "error", error: "Product not found" });
    }
    res.status(200).send(data);
  }).catch(e => {
    return res.status(400).send({ error: "error" });
  })
});

/* POST product */
router.post('/', authMiddleware, upload.single('productImage'), async (req, res) => {
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
  product.link = req.body.link;
  product.linkPeta = req.body.linkPeta;

  // Checks if brand is cruelty free, if is not so add information in product 
  if (req.body.brand != undefined && req.body.brand.name != undefined) {
    if (await Brand.findOne({ 'name': req.body.brand.name, 'isCrueltyFree': false })) {
      product.isCrueltyFree = false;
      product.isCrueltyFreeVerify = true;
    }
  }

  // checks is image 
  if (req.file.path != undefined)
    product.productImage = req.file.path;

  // checks if ingredients dont contains in ingredients table animal origin
  // if contains, so add false vegan in product
  await asyncForEach(req.body.ingredients, async (element) => {
    product.isVeganVerify = true;
    if (element != undefined) {
      if (await Ingredient.findOne({ 'name': element.name })) {
        product.isVegan = false;
        return true;
      }
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
router.put('/:id', authMiddleware, upload.single('productImage'), async (req, res) => {
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

    if (req.body.name != undefined)
      product.name = req.body.name;

    if (req.body.description != undefined)
      product.description = req.body.description;

    if (req.body.isVegan != undefined)
      product.isVegan = req.body.isVegan;

    if (req.body.isCrueltyFree != undefined)
      product.isCrueltyFree = req.body.isCrueltyFree;

    if (req.body.barcode != undefined)
      product.barcode = req.body.barcode;

    if (req.body.active != undefined)
      product.active = req.body.active;

    if (req.body.isVeganVerify != undefined)
      product.isVeganVerify = req.body.isVeganVerify;

    if (req.body.isCrueltyFreeVerify != undefined)
      product.isCrueltyFreeVerify = req.body.isCrueltyFreeVerify;

    if (req.body.brand != undefined)
      req.body.brand.name

    if (req.file != undefined)
      product.productImage = req.file.path;

    if (req.body.link != undefined)
      product.link = req.body.link;

    if (req.body.linkPeta != undefined)
      product.linkPeta = req.body.linkPeta;

    if (req.body.brand != undefined && req.body.brand.name != undefined) {
      if (await Brand.findOne({ 'name': req.body.brand.name, 'isCrueltyFree': false })) {
        product.isCrueltyFree = false;
        product.isCrueltyFreeVerify = true;
      }
    }

    if (req.body.ingredients != undefined) {
      await asyncForEach(req.body.ingredients, async (element) => {
        product.isVeganVerify = true;
        if (await Ingredient.findOne({ 'name': element.name })) {
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

/*PUT LIKE Product*/
router.put('/like/:id', authMiddleware, async (req, res) => {
  console.log("PUT ", req.params.id);

  const { id } = req.params;

  if (id == undefined)
    return res.status(400).send({ status: "error", error: "need to pass id " });

  if (!id.match(/^[0-9a-fA-F]{24}$/))
    return res.status(400).send({ status: "error", error: "Wrong id format" });

  // searching product
  Product.findById(id, async function (error, product) {
    if (error)
      res.send(error);

    if (!product)
      return res.status(200).json({ status: "error", message: 'product not found' });


    // searching user
    await User.findOne({ 'email': req.body.email }, await function (error, user) {
      if (error)
        res.send(error);
    }).then(user => {
      if (!user)
        return res.status(400).send({ status: "error", error: "User not found" });

      // checks if user already like product
      for (var i = 0; i < product.like.length; i++) {
        if (product.like[i].user.email == user.email) {
          return res.status(400).send({ status: "error", error: "User already likes it" })
        }
      }
      // checks if user already dislik product and remove
      for (var i = 0; i < product.dislike.length; i++) {
        if (product.dislike[i].user.email == user.email) {
          product.dislike.pull(product.dislike[i]);
        }
      }
      const UserSchema = new mongoose.Schema({
        id_: mongoose.Schema.Types.ObjectId,
        name: {
          type: String,
          require: true,
        },
        email: {
          type: String,
          required: true,
          lowercase: true,
        },
      });
      const LikeSchema = new mongoose.Schema({
        user: {
          type: UserSchema,
          required: true,
        },
      });
      UserSchema.name = user.name;
      UserSchema.email = user.email;
      UserSchema.id = user.id;
      LikeSchema.user = UserSchema;
      product.like.push(LikeSchema);
      product.save(function (error) {
        if (error)
          res.send(error);
        res.status(200).json({ status: "success", message: 'Liked it added to the product!' });
      });

    }).catch(e => {
      return res.status(400).send({ error: "Error" });
    })

  });
});

/*PUT dislike Product*/
router.put('/dislike/:id', authMiddleware, async (req, res) => {
  console.log("PUT ", req.params.id);

  const { id } = req.params;

  if (id == undefined)
    return res.status(400).send({ status: "error", error: "need to pass id " });

  if (!id.match(/^[0-9a-fA-F]{24}$/))
    return res.status(400).send({ status: "error", error: "Wrong id format" });

  // searching product
  Product.findById(id, async function (error, product) {
    if (error)
      res.send(error);

    if (!product)
      return res.status(200).json({ status: "error", message: 'product not found' });


    // searching user
    await User.findOne({ 'email': req.body.email }, await function (error, user) {
      if (error)
        res.send(error);
    }).then(user => {
      if (!user)
        return res.status(400).send({ status: "error", error: "User not found" });

      // checks if user already like product
      for (var i = 0; i < product.dislike.length; i++) {
        if (product.dislike[i].user.email == user.email) {
          return res.status(400).send({ status: "error", error: "User already dislikes it" })
        }
      }
      // checks if user already dislike product and remove
      for (var i = 0; i < product.like.length; i++) {
        if (product.like[i].user.email == user.email) {
          product.like.pull(product.like[i]);
        }
      }

      const UserSchema = new mongoose.Schema({
        id_: mongoose.Schema.Types.ObjectId,
        name: {
          type: String,
          require: true,
        },
        email: {
          type: String,
          required: true,
          lowercase: true,
        },
      });
      const LikeSchema = new mongoose.Schema({
        user: {
          type: UserSchema,
          required: true,
        },
      });
      UserSchema.name = user.name;
      UserSchema.email = user.email;
      UserSchema.id = user.id;
      LikeSchema.user = UserSchema;
      product.dislike.push(LikeSchema);
      product.save(function (error) {
        if (error)
          res.send(error);
        res.status(200).json({ status: "success", message: 'Dislike it added to the product!' });
      });

    }).catch(e => {
      return res.status(400).send({ error: "Error" });
    })

  });
});


/*PUT comments Product*/
router.put('/comments/:id', authMiddleware, async (req, res) => {
  console.log("PUT ", req.params.id);

  const { id } = req.params;

  if (id == undefined)
    return res.status(400).send({ status: "error", error: "need to pass id " });

  if (!id.match(/^[0-9a-fA-F]{24}$/))
    return res.status(400).send({ status: "error", error: "Wrong id format" });

  // searching product
  Product.findById(id, async function (error, product) {
    if (error)
      res.send(error);

    if (!product)
      return res.status(200).json({ status: "error", message: 'product not found' });


    // searching user
    await User.findOne({ 'email': req.body.email }, await function (error, user) {
      if (error)
        res.send(error);
    }).then(user => {
      if (!user)
        return res.status(400).send({ status: "error", error: "User not found" });

      const UserSchema = new mongoose.Schema({
        id_: mongoose.Schema.Types.ObjectId,
        name: {
          type: String,
          require: true,
        },
        email: {
          type: String,
          required: true,
          lowercase: true,
        },
      });

      const CommentsSchema = new mongoose.Schema({
        user: {
            type: UserSchema,
            required: true,
        },
        createdAt: {
            type: Date,
            default: Date.now,
        },
        description:{
            type: String, 
            required : true
        }
    });
      UserSchema.name = user.name;
      UserSchema.email = user.email;
      UserSchema.id = user.id;
      CommentsSchema.user = UserSchema;
      CommentsSchema.description  = req.body.description;
      product.comments.push(CommentsSchema);
      product.save(function (error) {
        if (error)
          res.send(error);
        res.status(200).json({ status: "success", message: 'comment it added to the product!' });
      });

    }).catch(e => {
      return res.status(400).send({ error: "Error" });
    })

  });
});

async function asyncForEach(array, callback) {
  for (let index = 0; index < array.length; index++) {
    await callback(array[index], index, array);
  }
}
/* DELETE product listing. */
router.delete('/:id', authMiddleware, async (req, res) => {
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
