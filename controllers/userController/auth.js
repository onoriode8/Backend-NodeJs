const User = require("../../models/userModel/auth");
const bcryptjs = require("bcryptjs");
const jwt = require("jsonwebtoken");
const { validationResult } = require("express-validator");
const mongoose = require("mongoose");
const nodemailer = require('nodemailer');

// let storedEmail = {};
exports.signup = async (req, res, next) => {
    const { email, username, password } = req.body;

    const errors = validationResult(req);
    if(!errors.isEmpty()) {
        return res.status(402).json("Please enter a valid credentials");
    }

    let existUser;
    try {
        existUser = await User.findOne({email: email});
    } catch(err) { return res.status(500).json("server not responding") };

    if(existUser) return res.status(406).json(`user with ${existUser.email} already exist, try again`)
 
    const hashedCode = "hdgswg";
    let hashOTP;
    let hashPassword;
    try {
        hashPassword = await bcryptjs.hash(password, 12); 
        hashOTP = await bcryptjs.hash(hashedCode, 12); 
    } catch(err) {
        return res.status(500).json("server error"); 
    }; 

    let date = new Date();

    const createdUser = new User({
        email: email, 
        username: username,
        password: hashPassword,
        image: [],
        OTP: hashOTP,
        signupDate: date.toDateString()
    });

    let token;
    try { 
        token = jwt.sign({ email, hashPassword, username }, 
            process.env.SECRET_TOKEN, {expiresIn: "1h"} );
        if(token === undefined) {
            throw new Error("failed to create web token");
        }
    } catch(err) {
        return res.status(500).json("server error, try again");  
    };

    if(!token) {
        return res.status(500).json("server error, token is empty");
    } 

    let saveUser;
    try {
        saveUser = await createdUser.save()
    } catch(err) {
        return res.status(500).json("Failed to create an account with your credentials");
    };

    if(!saveUser) return res.status(500).json("Failed to create user")

    // let session;
        //session = await mongoose.startSession();
        //await session.startTransaction();
    let mailTransporter = nodemailer.createTransport({
        service: process.env.GOOGLE_SERVICE,
        auth: {
            type: process.env.GOOGLE_CLOUD_OAUTH,
            user: process.env.GOOGLE_CLOUD_USER,
            pass: process.env.GOOGLE_CLOUD_PASSWORD,
            clientId: process.env.GOOGLE_CLIENT_ID,
            clientSecret: process.env.GOOGLE_CLIENT_SCECRET,
            refreshToken: process.env.REFRESH_TOKEN
        }
    });

    let mailOptions = {
        from: process.env.GOOGLE_CLOUD_USER,
        to: saveUser.email,
        subject: 'Created an account with onlineshop',
        text: `Welcome ${saveUser.email}. You just signup to osb-onlineshop`,
        html: '<b>(OSB) onlineshop'
      };

    try {
      await mailTransporter.sendMail(mailOptions, function(err, data){
        if (err) {
           //return res.status(502).json(err);
           console.log(err.message)
        } 
        console.log("sendMail Data line 97", data);
      });
    } catch(err) {
        return res.status(500).json(err.message);
    }

    res.status(200).json({email: saveUser.email, id: saveUser._id,
         username: saveUser.username, token: token, image: saveUser.image});
};

exports.login = async (req, res, next) => {
    const { email, password } = req.body;

    const errors = validationResult(req);
    if(!errors.isEmpty()) {
       return res.status(403).json("Please enter valid data");
    }

    let existEmail;
    try {
        existEmail = await User.findOne({email: email});
    } catch(err) {
        return res.status(500).json("Server error");
    };


    if(existEmail === null || undefined) {
        return res.status(422).json("User not found, create an account instead");
    }

    let hashPassword;
    try {
        hashPassword = await bcryptjs.compare(password, existEmail.password);
    } catch(err) {
        return res.status(500).json("Failed");
    };

    if(!hashPassword) {
        return res.status(403).json("wrong password, try again");
    };

    let token;
    try {
        token = jwt.sign({ userId: existEmail._id, email: existEmail.email},
            process.env.SECRET_TOKEN, { expiresIn: "1h" });
    } catch(err) {
        return res.status(500).json("Failed to create token");
    };

    return res.status(200).json({
        email: existEmail.email, id: existEmail._id, 
        username: existEmail.username, token: token, image: existEmail.image});
};