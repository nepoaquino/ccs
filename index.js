const express = require("express");
const { engine } = require("express-handlebars");
const bcrypt = require("bcryptjs");
const flash = require("connect-flash");
const cookieParser = require("cookie-parser");
const session = require("express-session");
const MongoDBStore = require("connect-mongodb-session")(session);
const passport = require("passport");
require("./db")()
require("./passport")(passport);
const methodOverride = require("method-override");
const url = require("url");
require("dotenv").config();

// Models
const User = require("./models/User");
const Event = require("./models/Event");

const app = express();

// Set static folder
app.use(express.static("public"));
app.use("/images", express.static("public"));
app.use("/articles", express.static("public"));
app.use("/articles/edit", express.static("public"));
app.use("/faqs/:id", express.static("public"));
app.use("/event", express.static("public"));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.set("json spaces", 2);

// Express handlebars setup
app.engine(".hbs", engine({ extname: ".hbs" }));
app.set("view engine", ".hbs")
app.set("views", "./views");

// Flash Messaging Setup
// app.use(cookieParser("secret"));
app.use(session({
    secret: "keyboard cat",
    resave: false,
    saveUninitialized: true,
    cookie: { maxAge: 60000 },
    store: new MongoDBStore({
        uri: process.env.MONGO_URI || "mongodb://127.0.0.1:27017/ccs",
        collection: "sessions"
    })
}));
app.use(flash());

app.use(passport.initialize());
app.use(passport.session());

app.use(methodOverride("_method"));

// Custom Middleware
const checkAuthenticated = require("./middleware.js");  

// Routers
app.use("/faqs", require("./routes/faqs"));
app.use("/articles", require("./routes/articles"));

app.use(function (req, res, next) {
    res.locals.success_msg = req.flash("success_msg");
    res.locals.error_msg = req.flash("error_msg");
    res.locals.error = req.flash("error");
    res.locals.success = req.flash("success");
    next()
});

app.get("/", async (req, res, next) => {
    try {
        res.render("home", { user: req.user ? req.user: false });
    } catch(err) { next(err) }
});

// http://localhost:1000/register - POST - User registration
app.post("/register", async (req, res, next) => {
    try {
        const { firstname, lastname, idNumber, username, password } = req.body;
        const newUser = await User.create({
            firstname, lastname, idNumber, username, password
        });
        req.flash("success_msg", "Successfully registered!");
        res.redirect("/");
    } catch(err) { next(err) }
});

app.post("/login", (req, res, next) => {
    passport.authenticate("local", {
        successRedirect: "/dashboard",
        failureRedirect: "/",
        successFlash: true,
        failureFlash: true
    })(req, res, next);
});

app.delete("/logout", (req, res, next) => {
    req.logOut((err) => {
        if (err) { return next(err) }
    });
    res.redirect("/");
});

app.get("/dashboard", checkAuthenticated, async (req, res, next) => {
    try {
        if (req.user.role === "student") {
            const events = await Event.find({ date: { $gte: new Date() } }).populate("reservers").lean();
            events.forEach(event => event.userID = req.user._id);
            res.render("student/dashboard", {
                user: req.user,
                events,
                helpers: {
                    formatDate(date) {
                        const dateTime = new Date(date);
                        const months = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
                        const formattedDateandTime = `${months[dateTime.getMonth()]} ${dateTime.getDate()}, ${dateTime.getFullYear()} | ${dateTime.getHours() > 12 ? dateTime.getHours() - 12 : dateTime.getHours()}:${dateTime.getMinutes() === 0? `0${dateTime.getMinutes()}` : dateTime.getMinutes()} ${dateTime.getHours() < 12 ? "am" : "pm"}`;
                        return formattedDateandTime
                    },
                    isCurrentUserReserved(reservers, currentUserID, eventID) {
                        const reserversIDs = reservers.map(reserver => reserver._id);
                        const isIDinArray = reserversIDs.some(id => id.toString() === currentUserID.toString());

                        if (!isIDinArray) {
                            return `
                            <form action="/event/${eventID}/reserver?_method=PUT" method="post">
                                <input type="hidden" name="userID" value="${currentUserID}">
                                <button type="submit" class="btn btn-sm btn-warning">Reserved a seat</button>
                            </form>
                            `;
                        } else {
                            return `<button type="button" class="btn btn-sm btn-warning" disabled>You are now on the list</button>`;
                        }
                    },
                    listofReservers(reservers, eventID) {
                        return reservers.map(reserver => {
                            return `
                                <li class="list-group-item secondary-bg-color text-white text-capitalize d-flex justify-content-between align-items-center">
                                    ${reserver.firstname} ${reserver.lastname}
                                    <form action="/event/${eventID}/reserver?_method=DELETE" method="post">
                                        <input type="hidden" name="userID" value="${reserver._id}">
                                        <button type="submit" class="badge bg-danger border-0">Cancel Reservation</button>
                                    </form>
                                </li>
                            `
                        }).join("");
                    }
                }
            });
        } else {
            const events = await Event.find().sort({ date: -1 }).lean();
            const user = await User.findById(req.user._id);
            res.render("admin/dashboard", { user, events });
        }
    } catch(err) { next(err) }

});

app.get("/event/:id", checkAuthenticated, async (req, res, next) => {
    try {
        const user = await User.findById(req.user._id);
        const event = await Event.findById(req.params.id).populate("reservers").populate("attendees").lean();
        res.render("event", {
            user,
            event,
            helpers: {
                listofReservers(reservers, eventID) {
                    return reservers.map(reserver => {
                        return `
                            <li class="list-group-item secondary-bg-color text-white text-capitalize d-flex justify-content-between align-items-center">
                                ${reserver.firstname} ${reserver.lastname}
                                <div class="d-flex align-items-center">
                                    <form action="/event/${eventID}/attendee?_method=PUT" method="post">
                                        <input type="hidden" name="userID" value="${reserver._id}">
                                        <button type="submit" class="btn btn-sm btn-primary">PRESENT</button>
                                    </form>
                                    <form action="/event/${eventID}/reserver?_method=DELETE" method="post">
                                        <input type="hidden" name="userID" value="${reserver._id}">
                                        <button type="submit" class="btn text-danger p-0"><i class="bi bi-x fs-5"></i></button>
                                    </form>
                                </div>
                            </li>
                        `
                    });
                }
            }
        });
    } catch (err) { next(err) }
});

app.post("/event", async (req, res, next) => {
    try {
        const event = await Event.create(req.body);
        res.redirect("/dashboard");
    } catch(err) { next(err) }
});

// Add reservers in event
app.put("/event/:id/reserver", async (req, res, next) => {
    try {
        const { userID } = req.body;
        const updEvent = await Event.findByIdAndUpdate(req.params.id, {
            $push: { reservers: userID }
        }, { new: true });
        req.flash("success_msg", "You successfully reserved a seat")
        res.redirect("/dashboard");
        return;
        // }
    } catch(err) { next(err) }
});

// Remove reservers in event
app.delete("/event/:id/reserver", async (req, res, next) => {
    try {
        const { userID } = req.body;
        const updEvent = await Event.findByIdAndUpdate(req.params.id, {
            $pull: { reservers: userID }
        }, { new: true });

        if (url.parse(req.headers.referer).pathname === "/dashboard") {
            req.flash("error_msg", "Your seat reservation is now cancelled")
            res.redirect("/dashboard");
        } else {
            res.redirect(`/event/${req.params.id}`);
        }
    } catch (err) { next(err) }
});

// Add attendees in event
app.put("/event/:id/attendee", async (req, res, next) => {
    try {
        const { userID } = req.body;
        const updEvent = await Event.findByIdAndUpdate(req.params.id, {
            $pull: { reservers: userID },
            $push: { attendees: userID }
        }, { new: true });
        res.redirect(`/event/${req.params.id}`);
        return;
        // }
    } catch(err) { next(err) }
});

// app.get("/downloadable-forms", (req, res) => {
//     res.render("downloadble-forms", { userLogged: req.user });
// });

app.get("/ces", (req, res) => {
    res.render("ces");
});

// Handles non-existing route
app.use((req, res, next) => {
    const error = new Error('Page Not Found');
    error.status = 404;
    next(error);
  });
  
// Error handler middleware
app.use((err, req, res, next) => {
    if (err.status === 404) {
        res.status(err.status).render("error", { err });
        return;
    }
});

const PORT = process.env.PORT || 1000;
app.listen(PORT, () => console.log(`Server is running on port: ${PORT}`));