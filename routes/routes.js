const express = require("express");
const router = express.Router();
const credential = require('../models/credentials');
const multer = require('multer');
const fs = require('fs');
const bcryptjs = require('bcryptjs');

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

router.get("/add",(req, res) => {
    res.render("add_credentials", { title: "Add credentials" });
})

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
            fs.unlinkSync("./uploads/" + req.body.old_image);
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
            fs.unlinkSync("./uploads/" + req.body.image);
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


module.exports = router;
