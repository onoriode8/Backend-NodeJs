const mongoose = require("mongoose");

const mongooseSchema = new mongoose.Schema({
    username: { type: String, required: true, trim: true },
    email: { type: String, required: true, trim: true },
    password: { type: String, required: true, trim: true },
    image: { type: [String], required: true },
    OTP: { type: String, required: true, trim: true },
    signupDate: { type: String, required: true }
});

const userModel = mongoose.model("Users", mongooseSchema);

module.exports = userModel;