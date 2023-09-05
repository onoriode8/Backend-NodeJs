const mongoose = require("mongoose");


const adminSchema = new mongoose.Schema({
    email: { type: String, required: true, trim: true },
    password: { type: String, required: true, trim: true },
    OTP: { type: String, required: true, trim: true }

});

module.exports = mongoose.model("Admin", adminSchema);