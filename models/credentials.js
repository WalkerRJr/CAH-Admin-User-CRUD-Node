const mongoose = require('mongoose');

// Defining the schema for the 'users' credential
const credentialSchema = new mongoose.Schema({
    username: {
        type: String,
        required: true // 'email' field is required and must be a string
    },
    token: {
        type: String,
        required: true // 'password' field is required and must be a string
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
});

// Creating a mongoose model based on the schema for the 'users' credential
const credential = new mongoose.model("users", credentialSchema);

// Exporting the mongoose model for use in other parts of the application
module.exports = credential;