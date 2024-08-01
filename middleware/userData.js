const jwt = require('jsonwebtoken')
const userModel = require('../models/userModel')

exports.userDataGetter = async (req, res, next) => {
    const token = req.cookies.userJwtAuth;

    if (!token) {
        return res.redirect('/user/login')
    }

    jwt.verify(token, process.env.KEY, async (err, decoded) => {

        if (err) {
            if (err.name === 'TokenExpiredError') {
                res.clearCookie('userJwtAuth');
                return res.redirect('/user/login?msg=tokenExpired');
            } else {
                return res.status(401).send('Unauthorized');
            }
        } else {
            const user = await userModel.findOne({ email: decoded.email })

            if (!user) {
                return res.redirect('/user/login')
            }

            req.user = user
            next()
        }
    });



}