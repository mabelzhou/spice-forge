const path = require("path");
const express = require("express");
const expressLayouts = require("express-ejs-layouts");
const mongoose = require("mongoose");
const session = require("express-session");
const fileUpload = require("express-fileupload");

// set up dotenv
const dotenv = require("dotenv");
dotenv.config({ path: "./config/keys.env" });

const app = express();

// make the assets folder public (or static)
// this moves the content of assets into the root directory 
//-> need to name folders accordingly 
app.use(express.static(path.join(__dirname, "/assets")));

// Set up EJS
app.set("view engine", "ejs");
app.set("layout", "layouts/main");
app.use(expressLayouts);

// set up body parser
app.use(express.urlencoded({ extended: true }));

// set up file upload
app.use(fileUpload());

// set up express session
app.use(session({
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: true
}));

// middleware
app.use((req, res, next) => {
    // save to global variables "locals"
    res.locals.user = req.session.user;
    res.locals.role = req.session.role;
    next();
});

// Configure controllers
const generalController = require("./controllers/generalController");
const mealkitsController = require("./controllers/mealkitsController");
const loadDataController = require("./controllers/loadDataController");
const cartController = require('./controllers/cartController');
app.use("/", generalController);
app.use("/mealkits/", mealkitsController);
app.use("/load-data/", loadDataController);
app.use("/cart/", cartController);

// This use() will not allow requests to go beyond it
// so we place it at the end of the file, after the other routes.
// This function will catch all other requests that don't match
// any other route handlers declared before it.
// This means we can use it as a sort of 'catch all' when no route match is found.
// We use this function to handle 404 requests to pages that are not found.
app.use((req, res) => {
    res.status(404).send("Page Not Found");
});

// This use() will add an error handler function to
// catch all errors.
app.use(function (err, req, res, next) {
    console.error(err.stack)
    res.status(500).send("Something broke!")
});

// Define a port to listen to requests on.
const HTTP_PORT = process.env.PORT || 8080;

// Call this function after the http server starts listening for requests.
function onHttpStart() {
    console.log("Express http server listening on: " + HTTP_PORT);
}

//Connect to MongoDB
mongoose.connect(process.env.MONGODB_CONNECTION_STRING)
    .then(() => {
        console.log("Connected to MongoDB database");
        app.listen(HTTP_PORT, onHttpStart);
    })
    .catch(err => {
        console.log(`Error connecting to MongoDB database: ${err}`);
    });

