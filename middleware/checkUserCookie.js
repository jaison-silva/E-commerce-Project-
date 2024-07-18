const jwt = require('jsonwebtoken');
const secretKey = "secret_key"

exports.userJwtAuth = (req, res, next) => {
    const token = req.cookies.userJwtAuth;
    if (token) {
        jwt.verify(token, secretKey, (err, decoded) => {
            if (err) {
                return res.redirect('/user/login');
            } else {
                next();
            }
        });
    } else {
        res.redirect('/user/login');
    }
}


// function userJwtAuth(req, res, next){
//     if(req.cookie && req.cookie.userJwtAuth){
//         next()
//     }else{
//         res.redirect('/user/login')
//     }
// } 

// userJwtAuth();