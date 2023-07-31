const User = require("../../models/userModel/auth");
const bcryptjs = require("bcryptjs");
// const jwt = require("jsonwebtoken");
const otpGenerator = require("otp-generator");
const { startSession } = require("mongoose");

let storedEmail = {};

exports.getCode = async (req, res, next) => {
    const { email } = req.body;

    if(email.trim().length < 6) {
        return res.status(422).json("Enter a valid email");
    };

    let emailExist;
    try {
        emailExist = await User.findOne({email});
    } catch (err) {
        return res.status(500).json("Server error");
    };

    if(!emailExist) {
        return res.status(404).json("email doesn't exist");
    }

    // otp generator 
    let codeGenerator;
    try {
        codeGenerator = otpGenerator.generate(6, { upperCaseAlphabets: true, specialChars: false });
    } catch(err) {
        return res.status(500).json("Try again later");
    };

    //hash the codeGeneator code (OTP) before saving to DB

    emailExist.OTP = codeGenerator

    // const saveOtp = new User({
    //     OTP: codeGenerator
    // });

    // const data = await saveOtp.save();
    // console.log("generate code and", codeGenerator);

    // console.log(emailExist);

    try {
        await emailExist.save();
    } catch(err) {
        return res.status(500).json("Failed to get code, try again");
    }

    //send otp to user email or through sms to input to the frontend.

    const emailuser = req.userEmail = { email: emailExist.email }   // stored email in request for easily retriever 
    console.log("before", storedEmail);
    storedEmail = {...emailuser};
    console.log("after", storedEmail);
 
    // next();
    // console.log(req);
    res.status(200).json(emailExist);
    // return res.status(200).json(`Enter the 6 digits code sent to your email ${emailExist.email}`); 
};

//sendCode
exports.sendCode = async (req, res, next) => {
    const userName = req.params.username;
    const code = req.body;
    const email = storedEmail.email;
    if(code.length < 6) {
        return res.status(403).json("Enter valid code");
    };

    console.log(email);

    let user;
    try {
        user = await User.findOne({email: email});
    } catch(err) {
        return res.status(500).json("server error");
    };

    console.log(user);
    if(!user) {
        return res.status(404).json("user not found");
    }

    console.log({code: code})
    console.log(code)

    if(user.OTP.toString() === code.toString()) {
        return res.status(200).json("success"); 
    } else {
        return res.status(403).json("Invalid code");
    };

}

// changePassword 
exports.changePassword = async (req, res, next) => {
    const password = req.body;
    const email = storedEmail.email;
    // const user = req.params.user;   req.userEmail = { email: emailExist.email }
    if(password.trim().length < 5) {
        return res.status(422).json("Choose a strong password");
    };

    let user;
    try {
        user = await User.findOne({email: email});
    } catch(err) {
        return res.status(500).json("server err");
    };

    let hashPassword;
    try {
        hashPassword = await bcryptjs.hash(password, 12);
    } catch(err) {
        return res.status(500).json("server error");
    };

    user.password = hashPassword;

    try {
        await user.save();
    } catch(err) {
        return res.status(500).json("server error");
    }

    res.status(201).json("password changed successfully");
}