const mongoose = require('mongoose');
const authConfig = require("../config/auth");

mongoose.connect('mongodb+srv://admin:'+authConfig.passworddb+'@savecheck-4guoq.mongodb.net/savecheckdb?retryWrites=true',
  { 
    useNewUrlParser: true
  } 
)

mongoose.Promise = global.Promise;

module.exports = mongoose;