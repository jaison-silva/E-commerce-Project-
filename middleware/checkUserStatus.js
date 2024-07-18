
exports.checkUserStatus = (req, res, next) => {
    // Ensure the user is attached to the req object
    if (req.user && req.user.status === false) {
        res.clearCookie('userJwtAuth');
        return res.redirect('/user/login?msg=userBlocked');
    } else if (req.user) {
        return next();
    } else {
        return res.redirect('/user/login');
    }
}
