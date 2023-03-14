function checkAuthenticated(req, res, next) {
    if (req.isAuthenticated()) {
        return next();
    }
    // console.log("You need to login first!")
    req.flash("error_msg", "You need to login first!")
    res.redirect("/");
}

module.exports = checkAuthenticated;