const jwt = require('jsonwebtoken');
const authCofing = require('../../config/auth.json');


module.exports = (req, res, next) => {
    const authHeader = req.headers.authorization;

    if(!authHeader)
        return res.status(401).send({ error: 'No token provided' });
    
    const parts = authHeader.split(' ');

    if(!parts.lenth === 2)
        return res.status(401).send({ error: 'Roken error' });
    
    const [ scheme, token ] = parts;

    if(!/^Bearer$/i.test(scheme))
        return res.status(401).send({ error: 'Token malformatted' });
    
    jwt.verify(token, authCofing.secret, (err, decoded)=> {
        if(err) return res.status(401).send({ error: 'Token invalid' });

        req.userId = decoded.id;
        return next();
    });
};