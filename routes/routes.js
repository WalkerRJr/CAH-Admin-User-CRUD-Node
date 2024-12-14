const express = require("express");
const router = express.Router();
const credential = require('../models/credentials');
const multer = require('multer');
const fs = require('fs');
const bcryptjs = require('bcryptjs');

const dayjs = require("dayjs");


// EJS FUNCTIONS ==============================================================================
function dateFormat(date){
    return dayjs(date).format('ddd, MMM DD, YYYY hh:mm: A');
}

// If resident lived at the Vineyards less than or equal 45 days there "NEW" 
function checkDate(date) { 
    var date1 = dayjs(date);
    var date2 = dayjs();
    var diff = date2.diff(date1,'day',true);

    return !date ? "" : diff <= 45 ? "NEW" : "";
}

// image upload =========================================================================================
var storage = multer.diskStorage({
    destination: function(req, file, cb){
        cb(null, './uploads')
    },
    filename: function(req, file, cb){
        cb(null, file.fieldname+"_"+Date.now()+"_"+file.originalname);
    },
});

var upload = multer({
    storage: storage,
}).single("image");

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

    resident.save()
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

router.get("/add", (req, res) => {
    res.render("add_credentials", { title: "Maintenance | Add" });
})

router.get("/", (req, res) => {
    credential.find().exec()
    .then((credential) =>{
        res.render('index', {
            // title: "Maintenance | User List",
            credential: credential,
            checkDate: checkDate
        })       
    })
    .catch((err) =>{
        res.json({ message: err.message });       
    }) 
})
// Edit an resident route =====================================================================
router.get('/edit/:id', (req, res) => {
    let id = req.params.id;
    credential.findById(id)
    .then((credential) => {
        res.render("edit_credentials", {
            title: "Maintenance | Edit",
            credential: credential,
            dateFormat: dateFormat
        })
    })
    .catch((err) =>{
        res.json({ message: err.message });       
    })

});

// Update resident route ======================================================================
router.post('/update/:id', upload, async (req, res) =>{
    let id = req.params.id;
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

    credential.findByIdAndUpdate(id, {
        username: req.body.username,
        password: new_password,
        updatedAt: Date.now()
        }) 
        .then((credential) =>{
            req.session.message = {
                type: 'success',
                message: credential.username + ' updated successfully!'
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
    
    credential.findByIdAndDelete(id)
        .then((result) =>{
            req.session.message = {
                type: 'info',
                message: 'User (' + result.username  + ') deleted successfully!'
            };
            res.redirect('/');
        })
        .catch((err) =>{
            res.json({ message: err.message });       
        })

});


module.exports = router;
