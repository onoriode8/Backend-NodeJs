const User = require("../../models/userModel/auth");
const bcryptjs = require("bcryptjs");
const jwt = require("jsonwebtoken");
const otpGenerator = require("otp-generator");
const { startSession } = require("mongoose");
const nodeMailer = require('nodemailer')

let storedEmail = {};

exports.getCode = async (req, res) => {
    const { email } = req.body;

    console.log("email received", email)
    if(email.trim().length < 6) {
        return res.status(422).json("Enter a valid email");
    };

    let emailExist;
    try {
        emailExist = await User.findOne({email});
    } catch (err) {
        return res.status(500).json("Server error");
    };

    console.log("email-exist", emailExist);

    if(!emailExist) {
        return res.status(404).json("email doesn't exist, login instead");
    }

    // otp generator 
    let codeGenerator;
    try {
        codeGenerator = otpGenerator.generate(6, { upperCaseAlphabets: true, specialChars: false });
    } catch(err) {
        return res.status(500).json("Try again later");
    };

    //send otp to user email or through sms to input to the frontend.
    let mailTransporter = nodeMailer.createTransport({
        service: process.env.GOOGLE_SERVICE,
        auth: {
            type: process.env.GOOGLE_CLOUD_OAUTH,
            user: process.env.GOOGLE_CLOUD_USER,
            pass: process.env.GOOGLE_CLOUD_PASSWORD,
            clientId: process.env.GOOGLE_CLIENT_ID,
            clientSecret: process.env.GOOGLE_CLIENT_SCECRET,
            refreshToken: process.env.REFRESH_TOKEN
        }
    })

    let mailOptions = {
        from: process.env.GOOGLE_CLOUD_USER,
        to: emailExist.email,
        subject: '(OSB) onlineshop',
        text: 
        `Hi ${emailExist.email}. We detect someone trying to login into your account, ignore if this is you. Your 6 digit OTP code
         ${codeGenerator}`
      };

      await mailTransporter.sendMail(mailOptions, function(err, data) {
        if (err) {
           return res.status(502).json(err);
        } 
      });

    //hash the codeGenerator code (OTP) before saving to DB
    let hashedOtp;
    try {
        hashedOtp = await bcryptjs.hash(codeGenerator, 12);
    } catch(err) {
        return res.status(500).json("Failed to get details")
    }

    emailExist.OTP = hashedOtp

    // let sess;
    try {
        await emailExist.save();
    } catch(err) {
        return res.status(500).json("Failed to get code, try again");
    }

    const emailuser = req.userEmail = { email: emailExist.email }   // stored email in request for easily retriever 
    console.log("before", storedEmail);
    storedEmail = {...emailuser};
    console.log("after", storedEmail);
 
    // next();
    // console.log(req);
    res.status(200).json("success");
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