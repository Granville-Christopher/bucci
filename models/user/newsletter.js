const mongoose = require("mongoose");

// Define the User Schema
const newsletterSchema = new mongoose.Schema({

    email: {
        type: String,
        required: true,
        unique: true 
    },

});

// Create and export the User model
const Newsletter = mongoose.model("Newsletter", newsletterSchema);
module.exports = Newsletter;
