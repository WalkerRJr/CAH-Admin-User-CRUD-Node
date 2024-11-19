const express = require('express');
const mongoose = require('mongoose');
const serverless = require('serverless-http');

const session = require('express-session');
const { v4:uuidv4 } = require("uuid")

require('dotenv').config();

const app = express();
const router = express.Router();

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI)
.then(() => console.log(`MongoDB connection success on : ${mongoose.connection.host}`))
.catch(err => console.error('Could not connect to MongoDB', err));

//=============================================================================================
// middlewares
app.use(express.urlencoded({ extended: false }));
app.use(express.json());

app.use(
    session({
        secret:uuidv4(),
        // secret:"my secret key",
        saveUninitialized: false,       // Don't create session until something stored
        resave: false,                  // Don't save session if unmodified
    })
);

app.use((req, res, next) => {
    res.locals.message = req.session.message;
    delete req.session.message;
    next();
})

// app.use(express.static('uploads'));
app.use(express.static('public'));

// set template engine
app.set('view engine', 'ejs');

const credential = require('../models/credentials');

const multer = require('multer');
const fs = require('fs');
const bcryptjs = require('bcryptjs');
const dayjs = require("dayjs");


// EJS FUNCTIONS ==============================================================================
function dateFormat(date){
    return dayjs(date).format('ddd, MMM DD, YYYY hh:mm: A');
}
// Regular Expression to reformat a US phone number in Javascript
function formatPhone(str) {
    var cleaned = ('' + str).replace(/\D/g, '');
    var match = cleaned.match(/^(1|)?(\d{3})(\d{3})(\d{4})$/);
    if (match) {
        var intlCode = (match[1] ? '+1 ' : '');
        return [intlCode, '(', match[2], ') ', match[3], '-', match[4]].join('');
    }
    return " ";
}
// Format nickname
function formatNickname(str){
    return isEmpty(str)?'':'"' + str  + '"';
}
// Test for an empty string
function isEmpty(value) {
    return (typeof value == 'string' && !value.trim()) || typeof value == 'undefined' || value === null || value == 'undefined';
}
function getResidentType(record) {
    let cate = [];
    record.militaryService ? cate.push("Veteran") : ""; cate.push(record.personnelType) ;
    return (cate.length>0)? cate.join(" | ") :""
} 
// image upload ===============================================================================
var storage = multer.diskStorage({
    destination: function(req, file, cb){
        cb(null, '../public/uploads')
    },
    filename: function(req, file, cb){
        cb(null, file.fieldname+"_"+Date.now()+"_"+file.originalname);
    },
});

var upload = multer({
    storage: storage,
}).single("image");

router.get("/",(req, res) => {
    credential.find().exec()
    .then((credential) =>{
        res.render('index', {
            title: "Maintenance-User",
            credential: credential,
        })       
    })
    .catch((err) =>{
        res.json({ message: err.message });       
    }) 
});

// Insert an resident into database route =====================================================
router.post('/add',upload, async (req, res) => {

    let new_password = '';
    let str = req.body.password;
    let firstSixChars = str.slice(0,6);

    if (str){
        if ( firstSixChars == '$2a$10' || firstSixChars == '$2b$10' ){
            new_password = str;
        } else {
            new_password = await bcryptjs.hash(str,10);
        }
    } 

    const credential = new credential({
        email: req.body.email,
        image: req.file.filename,
        password: new_password
    });
    credential.save()
    .then(() => {
        req.session.message = {
            type: 'success',
            message: 'Credential added successfully!'
        };
        res.redirect('/');    
    })
    .catch((err) =>{
        res.json({message: err.message, type: 'danger'});
    });

});

router.get("/add",(req, res) => {
    res.render("add_credentials", { title: "Add credentials" });
})

// Edit an resident route =====================================================================
router.get('/edit/:id', (req, res) => {
    let id = req.params.id;
    credential.findById(id)
    .then((credential) => {
        res.render("edit_credentials", {
            title: "Edit credential",
            credential: credential
        })
    })
    .catch((err) =>{
        res.json({ message: err.message });       
    })

});

// Update resident route ======================================================================
router.post('/update/:id', upload, async (req, res) =>{
    let id = req.params.id;
    let new_image = '';
    let new_password = '';
    let str = req.body.password;
    let firstSixChars = str.slice(0,6);

    if (str){
        if ( firstSixChars == '$2a$10' || firstSixChars == '$2b$10' ){
            new_password = str;
        } else {
            new_password = await bcryptjs.hash(str,10);
        }
    } 

    if (req.file){
        new_image = req.file.filename;
        try {
            fs.unlinkSync("./public/uploads/" + req.body.old_image);
        } catch(err){
            console.log(err);
        }
    } else {
        new_image = req.body.old_image;
    }

    credential.findByIdAndUpdate(id, {
        email: req.body.email,
        image: new_image,
        password: new_password,
        updatedAt: Date.now()
        }) 
        .then((credential) =>{
            req.session.message = {
                type: 'success',
                message: credential.email + ' updated successfully!'
            };
            res.redirect('/');
        })
        .catch((err) =>{
            res.json({ message: err.message });       
        })

});

// Delete resident route ======================================================================
router.get('/delete/:id', (req, res) => {
    let id = req.params.id;

    if (req.file){
        try {
            fs.unlinkSync("./public/uploads/" + req.body.image);
        } catch(err){
            console.log(err);
        }
    }
    
    credential.findByIdAndDelete(id)
        .then((result) =>{
            req.session.message = {
                type: 'info',
                message: 'User (' + result.email  + ') deleted successfully!'
            };
            fs.unlinkSync('./uploads/'+result.image);
            res.redirect('/');
        })
        .catch((err) =>{
            res.json({ message: err.message });       
        })

});
// ============================================================================================
app.use('/', router);

module.exports.handler = serverless(app);