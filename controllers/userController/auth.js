const User = require("../../models/userModel/auth");
const bcryptjs = require("bcryptjs");
const jwt = require("jsonwebtoken");
// const otpGenerator = require("otp-generator");
const { startSession } = require("mongoose");

// let storedEmail = {};
exports.signup = async (req, res, next) => {
    const { email, username, password } = req.body;

    if(email.trim().length < 5 && username.trim().length < 3 && password.trim().length < 6) {
        return res.status(402).json("Please enter a valid credentials");
    }

    let existUser;
    try {
        existUser = await User.findOne({email: email});
    } catch(err) { return res.status(500).json("server not responding") };

    if(existUser) return res.status(406).json(`user with ${existUser.email} already exist, try again`)
 
    let hashPassword;
    try {
        hashPassword = await bcryptjs.hash(password, 12); 
    } catch(err) {
        return res.status(500).json("server error"); 
    }; 

    let date = new Date();

    const createdUser = new User({
        email: email, 
        username: username,
        password: hashPassword,
        image: [],
        OTP: "hdgswg",
        date: date.toDateString()
    });

    let token;
    try { 
        token = jwt.sign({ email, hashPassword, username }, 
            process.env.SECRET_TOKEN, {expiresIn: 60 * 60} );
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

    res.status(200).json({email: saveUser.email, id: saveUser._id,
         username: saveUser.username, token: token, image: saveUser.image});
};

exports.login = async (req, res, next) => {
    const { email, password } = req.body;

    if(email.trim().length < 5 && password.trim().length < 6) {
        return res.status(403).json("Please enter valid data");
    };

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
            process.env.SECRET_TOKEN, { expiresIn: 60 * 60 });
    } catch(err) {
        return res.status(500).json("Failed to create token");
    };

    return res.status(200).json({
        email: existEmail.email, id: existEmail._id, 
        username: existEmail.username, token: token, image: existEmail.image});
};