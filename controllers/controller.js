const userModel = require('../models/userModel');
const jwt = require('jsonwebtoken');

exports.index = async (req, res) => {
    try {
        // Check if req.cookies exists and then check for userJwtAuth and adminJwtAuth cookies
        if (req.cookies && req.cookies.userJwtAuth) {

            const token = req.cookies.userJwtAuth;

            jwt.verify(token, process.env.KEY, async (err, decoded) => {
                if (err) {
                    if (err.name === 'TokenExpiredError') {
                        res.clearCookie('userJwtAuth');
                        return res.redirect('/user/login?msg=tokenExpired');
                    } else {
                        return res.status(401).send('Unauthorized');
                    }
                } else {
                    console.log(decoded.email + " this is the email from the token");
                    const user = await userModel.findOne({ email: decoded.email });
                    console.log(user + " this is the user");

                    if (user && user.status) {
                        res.render('user/index', { user: true });
                    } else {
                        res.clearCookie("userJwtAuth");
                        return res.redirect('/user/login?msg=userBlocked');
                    }
                }
            });

        } else if (req.cookies && req.cookies.adminJwtAuth) {
            res.redirect('/admin');
        } else {
            res.render('user/index', { user: false });
        }
    } catch (e) {
        console.log(e);
        res.status(500).send("Error");
    }
};
