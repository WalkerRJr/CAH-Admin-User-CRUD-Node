// imports
require('dotenv').config();

const express = require('express');
const mongoose = require('mongoose');
const session = require('express-session');
const { v4:uuidv4 } = require("uuid")

const app = express();
const PORT = process.env.PORT || 800;

// database connection
mongoose.connect(process.env.DB_URI);
const db = mongoose.connection;
db.on("error", (error) => console.log(error));
db.once("open", () => console.log(`MongoDB connection success on : ${mongoose.connection.host}`));

// middlewares
app.use(express.urlencoded({ extended: false }));
app.use(express.json());

app.use(
    session({
        secret:uuidv4(),
        saveUninitialized: false,       // Don't create session until something stored
        resave: false,                  // Don't save session if unmodified
    })
);

app.use((req, res, next) => {
    res.locals.message = req.session.message;
    delete req.session.message;
    next();
})

app.use(express.static('uploads'));
app.use(express.static('public'));

// set template engine
app.set('view engine', 'ejs');

// route prefix
app.use("", require("./routes/routes"));

app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
})