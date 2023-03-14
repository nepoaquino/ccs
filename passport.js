const bcrypt = require("bcryptjs");
const LocalStrategy = require("passport-local");
const User = require("./models/User");

function passportAuth(passport) {
    passport.use(new LocalStrategy(async (username, password, done) => {
        // console.log(username, password)
        const user = await User.findOne({username: username});
        // console.log(user)
        if (!user) {
            // console.log("No user found")
            return done(null, false, { message: "No User Found" });
        }
        // console.log(password, typeof password)
        // console.log(user.password, typeof user.password)
        const isMatch = await bcrypt.compare(password, user.hashedPassword);
        // console.log(isMatch)
        if (!isMatch) {
          return done(null, false, { message: 'Incorrect password' });
        }
        return done(null, user, { message: `Welcome ${user.username}` });
    }));
    
    passport.serializeUser((user, done) => {
        done(null, user)
    })
    passport.deserializeUser((user, done) => {
        done(null, user)
    })
}

module.exports = passportAuth;