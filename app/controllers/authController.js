const express = require('express');
const bcrypt = require('bcryptjs');
const User = require('../models/user');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const mailer = require('../../modules/mailer');
const authConfig = require("../../config/auth");

const router = express.Router();
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
function generateToken(params = {}){
    return token = jwt.sign(params, authConfig.secret, {
        expiresIn: 86400,
    });
}
router.post('/forgot_password', async(req,res) => {
    const{email} =req.body;
    
    try {
          const user = await User.findOne({email});

          if(!user)
            return res.status(400).send({ error: "User not found" });
          
          const token = crypto.randomBytes(20).toString('hex');

          const now = new Date();
          now.setHours(now.getHours() +1);

          await User.findByIdAndUpdate(user.id,{
              '$set':{
                  passwordResetToken: token,
                  passwordResetExpires: now,
              }
          });

          mailer.sendMail({
              to: email,
              from: 'safecheckvegan@gmail.com',
              template:'auth/forgot_password',
              context: {token},
          }, (err)=> {
                if(err){
                    console.log(err);
                    return res.status(400).send({error: 'Cannot send forgot password email'});
                }
                return res.send();

          })
    } catch (error) {
        console.log(error);
        res.status(400).send({error: "Erro on forgot password, try again"});
    }
});

router.post('/reset_password', async(req,res) =>{
    const {email,token,password} =req.body;

    try {
        const user = await User.findOne({email})
            .select('+passwordResetToken passwordResetExpires');
        
        if(!user)
            return res.status(400).send({ error: "User not found" });
        
        if(token !== user.passwordResetToken)
            return res.status(400).send({error: 'Token invalid'});

        const now = new Date();

        if(now > user.passwordResetExpires)
            return res.status(400).send({error: 'TOken expired, genereate a new one'});
        
        user.password = password;

        await user.save();

        res.send();



    } catch (err) {
        res.status(400).send({error: 'Cannot reset password, try again'});
    }
})

router.post('/register', async (req,res)=>{
    const { email } = req.body;
    try{
        if(await User.findOne({ email }))
            return res.status(400).send({ error: "user already exist" });
        const user = await User.create(req.body);

        user.password = undefined;

        return res.send({
            user,
            token : generateToken({ id: user.id }),
        });
    }catch(err){
        return res.status(400).send({error: 'Registration failed'});
    }
});

router.get('/users', async(req,res)=>{
    try{
        const users = await User.find({}).select('+password');
        return res.send(users);
    }catch(err){
        return res.status(400).send({error: 'Falha na consulta'});
    }
});

router.post('/authenticate', async (req,res) =>{
    const{ email, password } = req.body;

    if(email == undefined)
        return res.status(400).send({error : "Need email for authentication "});
    
    if(password == undefined)
        return res.status(400).send({error : "Need password for authentication "});
    
    const user = await User.findOne({ email }).select('+password');

    if( !user )
        return res.status(400).send({ error: "User not found" });
    
    if(!await bcrypt.compare(password, user.password))
        return res.status(400).send({ error: 'Invalid password' });

    user.password = undefined;

    res.send({
        user,
        token : generateToken({ id: user.id }),
    });
});

router.delete('/:id', function(req, res, next) {
    console.log("Delete ", req.params.id);
    User.remove({
      _id: req.params.id
    }, function(error) {
      if(error)
        res.send(error);
      //Se não teve erro, retorna response normal (200)
      res.sendStatus(200);
    });
  });


module.exports = app => app.use('/auth', router);