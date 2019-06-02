const nodemailer = require("nodemailer");
const hbs = require('nodemailer-express-handlebars');
const exphbs = require('express-handlebars')
const path = require('path');

const{service,user,pass} = require('../config/mail.json'); 



const transport = nodemailer.createTransport({
    service,    
    auth: { user, pass}
  });
  const handlebarOptions = {
       viewEngine: { 
            extName: '.html',
            partialsDir: './src/resource/mail/', 
            defaultLayout: '', 
        }, 
   viewPath: './src/resource/mail/',
    extName: '.html', }; transport.use('compile',
     hbs(handlebarOptions
        ));

        transport.use('compile', hbs(handlebarOptions))

  module.exports = transport;