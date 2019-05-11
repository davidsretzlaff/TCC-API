const express = require('express');
const bcrypt = require('bcryptjs');
const User = require('../models/user');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');

const authConfig = require("../../config/auth");

const router = express.Router();

function generateToken(params = {}){
    return token = jwt.sign(params, authConfig.secret, {
        expiresIn: 86400,
    });
}

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

router.post("/forgot_password", async (req, res)=> {
    const{ email } = req.body;

    try {
        
        const  user = await User.findOne({ email })

        if( !user )
            return res.status(400).send({ error: "User not found" });
        
        const token = crypto.randomBytes(20).toString('hex');

    } catch(err){
        res.status(400).send({ error : 'error on forgot password, try again later' });
    }
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