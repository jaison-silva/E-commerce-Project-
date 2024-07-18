const jwt = require('jsonwebtoken')
const userModel = require('../models/userModel')

exports.userDataGetter = async (req, res, next) => {
    const token = req.cookies.userJwtAuth;

    if (!token) {
        return res.redirect('/user/login')
    }

    const decoded = jwt.verify(token, 'secret_key');


    const user = await userModel.findOne({ email: decoded.email })

    if (!user) {
        return res.redirect('/user/login')
    }

    req.user = user
    next()
}