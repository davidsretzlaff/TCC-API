const express = require('express');
const authMiddleware = require('../middlewares/auth')
const router = express.Router();
var mongoose = require('mongoose');
var Brand = require('../models/brand')
const multer = require('multer');
var User = require('../models/user')


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

async function checkPermission(email){
const user = await User.findOne({ email });

if( !user )
  return false;

if(user.type != "admin")
  return false;

return true;
}

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

/* GET produtos by id listing. */
router.get('/:id', function (req, res, next) {
  console.log("search brand to id", req.params.id)
  const { id } = req.params;

  if (id == undefined)
    return res.status(400).send({ status: "error", error: "need to pass id " });

  if (!id.match(/^[0-9a-fA-F]{24}$/))
    return res.status(400).send({ status: "error", error: "Wrong id format" });

  Brand.findById(req.params.id, function (error, brands) {
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

// GET NAME //
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
      return res.status(400).send({ status: "error", error: "Marca não encontrada" });

    res.status(200).send(data);
  }).catch(e => {
    return res.status(400).send({ error: "Error" });
  })
});

/* POST brand */
router.post('/', upload.single('brandImage'), async (req, res) => {
  const { email,password,name} = req.body;

  console.log("POST");
  if (req.file != undefined)
    console.log(req.file);

  if (!name) {
    return res.status(400).send({ status: "error", error: "Precisa preencher o nome" });
  }

  if (await Brand.findOne({ name })) {
    return res.status(400).send({ status: "error", error: "Marca já existe" });
  }
  var brand = new Brand();
  brand._id = new mongoose.Types.ObjectId(),
    brand.name = req.body.name;
  brand.description = req.body.description;
  brand.isVegan = req.body.isVegan;
  brand.isCrueltyFree = req.body.isCrueltyFree;
  brand.linkPeta = req.body.linkPeta;
  brand.link = req.body.link;
  brand.ative = false;

  if (req.file != undefined && req.file.path != undefined)
    brand.brandImage = req.file.path;

  brand.save(function (error) {
    if (error)
      res.status(500).send(err);

    res.sendStatus(201);
  });
});


/* PUT BRAND */
router.put('/:id', upload.single('brandImage'), async function  (req, res, next) {
  const { email,password} = req.body;
  const { id } = req.params;

  if(email == undefined || password == undefined)
    return res.status(400).send({error : "Need email and password for authentication "});
  
  
  if(!await checkPermission(email))
    return res.status(400).send({error: "Permission denied"})

  console.log("PUT ", req.params.id);

  if (id == undefined)
    return res.status(400).send({ status: "error", error: "need to pass id " });

  if (!id.match(/^[0-9a-fA-F]{24}$/))
    return res.status(400).send({ status: "error", error: "Wrong id format" });

  Brand.findById(id, async function (error, brand) {
    if (error)
      res.send(error);
    if (!brand)
      return res.status(200).json({ status: "error", message: 'brand not found' });

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
      if (req.body.linkPeta != undefined)
        brand.linkPeta = req.body.linkPeta;
      if (req.body.link != undefined)
        brand.link = req.body.link;
      if (req.file != undefined && req.file.path != undefined)
        brand.brandImage = req.file.path
      brand.save(function (error) {
        if (error)
          res.send(error);
        //Se não teve erro, retorna response normal (200)
        res.sendStatus(200);
      });

  });
});
router.delete('/:id', async (req, res) => {
  const { email,password} = req.body;
  const { id } = req.params;

  if(email == undefined || password == undefined)
    return res.status(400).send({error : "Need email and password for authentication "});
  
  if(!await checkPermission(email))
    return res.status(400).send({error: "Permission denied"})

  console.log("Delete ", req.params.id);

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


/*  GET brand by pendent */
router.get('/pendent/:pendent', async function (req, res, next) {
  const { email,password} = req.body;

  if(email == undefined || password == undefined)
    return res.status(400).send({error : "Need email and password for authentication "});

  if(!await checkPermission(email))
    return res.status(400).send({error: "Permission denied"})

  console.log("search brand to name", req.params.name)
  const { pendent } = req.params;
  if (pendent == undefined)
    return res.status(400).send({ status: "error", error: "needs send value" });

  Brand.find({
    ative: pendent,
  }).then(data => {
    if (data.length == 0)
      return res.status(400).send({ status: "error", error: "Brand not found" });

    res.status(200).send(data);
  }).catch(e => {
    return res.status(400).send({ error: "Error" });
  })
});


/*PUT LIKE Brand*/
router.put('/like/:id', async (req, res) => {
  const { email} = req.body;
  const { id } = req.params;

  if(email == undefined)
    return res.status(400).send({error : "Email inválido"});

  console.log("PUT ", req.params.id);

  if (id == undefined)
    return res.status(400).send({ status: "error", error: "Need to pass id " });

  if (!id.match(/^[0-9a-fA-F]{24}$/))
    return res.status(400).send({ status: "error", error: "Id inválido" });

  // search brand
  Brand.findById(id, async function (error, brand) {
    if (error)
      res.send(error);

    if (!brand)
      return res.status(200).json({ status: "error", message: 'Marca não encontrada' });

    await User.findOne({ 'email': req.body.email }, await function (error, user) {
      if (error)
        res.send(error);
    }).then(user => {
      if (!user)
        return res.status(400).send({ status: "error", error: "Usuário não encontrado" });

      // checks if user already like
      for (var i = 0; i < brand.like.length; i++) {
        if (brand.like[i].user.email == user.email) {
          return res.status(400).send({ status: "error", error: "Usuário já curtiu" })
        }
      }
      // checks if user already dislike and remove
      for (var i = 0; i < brand.dislike.length; i++) {
        if (brand.dislike[i].user.email == user.email) {
          brand.dislike.pull(brand.dislike[i]);
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
      brand.like.push(LikeSchema);
      brand.save(function (error) {
        if (error)
          res.send(error);
        res.status(200).json({ status: "success", message: 'Curtida adicionada' });
      });

    }).catch(e => {
      return res.status(400).send({ error: "Error" });
    })

  });
});

/*PUT dislike brand*/
router.put('/dislike/:id', async (req, res) => {
  const { email} = req.body;
  const { id } = req.params;

  if(email == undefined)
    return res.status(400).send({error : "Email inválido "});

  console.log("PUT ", req.params.id);

  if (id == undefined)
    return res.status(400).send({ status: "error", error: "Id inválido " });

  if (!id.match(/^[0-9a-fA-F]{24}$/))
    return res.status(400).send({ status: "error", error: "Id inválido" });

  // search brand
  Brand.findById(id, async function (error, brand) {
    if (error)
      res.send(error);

    if (!brand)
      return res.status(200).json({ status: "error", message: 'Brand not found' });


    // search user
    await User.findOne({ 'email': req.body.email }, await function (error, user) {
      if (error)
        res.send(error);
    }).then(user => {
      if (!user)
        return res.status(400).send({ status: "error", error: "Usuário não encontrado" });

      // checks if user already dislike
      for (var i = 0; i < brand.dislike.length; i++) {
        if (brand.dislike[i].user.email == user.email) {
          return res.status(400).send({ status: "error", error: "Usuário já deixou seu descontentamento" })
        }
      }
      // check if user already like and remove
      for (var i = 0; i < brand.like.length; i++) {
        if (brand.like[i].user.email == user.email) {
          brand.like.pull(brand.like[i]);
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
      brand.dislike.push(LikeSchema);
      brand.save(function (error) {
        if (error)
          res.send(error);
        res.status(200).json({ status: "success", message: 'Descontentamento adicionado' });
      });

    }).catch(e => {
      return res.status(400).send({ error: "Error" });
    })

  });
});


/*PUT comments brand*/
router.put('/comments/:id', async (req, res) => {
  const { email} = req.body;
  const { id } = req.params;

  if(email == undefined )
    return res.status(400).send({error : "Email inválido "});

  console.log("PUT ", req.params.id);

  if (id == undefined)
    return res.status(400).send({ status: "error", error: "need to pass id " });

  if (!id.match(/^[0-9a-fA-F]{24}$/))
    return res.status(400).send({ status: "error", error: "Wrong id format" });

  // searching product
  Brand.findById(id, async function (error, brand) {
    if (error)
      res.send(error);

    if (!brand)
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
      brand.comments.push(CommentsSchema);
      brand.save(function (error) {
        if (error)
          res.send(error);
        res.status(200).json({ status: "success", message: 'comment it added to the brand!' });
      });

    }).catch(e => {
      return res.status(400).send({ error: "Error" });
    })

  });
});

//delete comments
router.put('/deletecomments/:id', async (req, res) => {
  const { email,_id} = req.body;
  const { id } = req.params;

  if(email == undefined )
    return res.status(400).send({error : "Email inválido"});

  console.log("Delete ", req.params.id);

  if (id == undefined)
    return res.status(400).send({ error: "Precisa informar o id do produto" });

  if (!id.match(/^[0-9a-fA-F]{24}$/))
    return res.status(400).send({ error: "ID inválido" });

    Brand.findById(id, async function (error, brand) {
      if (error)
        res.send(error);
  
      if (!brand)
        return res.status(200).json({ status: "error", message: 'Marca não encontrada' });
        
        // checks comment in brand and remove
        for (var i = 0; i < brand.comments.length; i++) {
          if (brand.comments[i]._id == _id) {
            brand.comments.pull(brand.comments[i]);
          }
        }
        brand.save(function (error) {
          if (error)
            res.send(error);
          res.status(200).json({ status: "success", message: 'Comentário excluído' });
        });
    });
  });
  
module.exports = app => app.use('/brand', router);

