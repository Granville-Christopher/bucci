const mongoose = require("mongoose");

// Define the User Schema
const adminSchema = new mongoose.Schema({
    fullname: {
        type: String,
        required: true
    },
    email: {
        type: String,
        required: true,
        unique: true 
    },
    phone: {
        type: String,
        required: true
    },
    password: {
        type: String,
        required: true
    },
    otp: {
         type: String 
    },
    otpExpiresAt: { 
        type: Date 
    }
});

// Create and export the User model
const Admin = mongoose.model("Admin", adminSchema);
module.exports = Admin;
