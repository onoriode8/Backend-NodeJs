const AdminSchema = require("../../models/adminModel/adminSchema");
const { validationResult } = require("express-validator");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken")
const otpGenerator = require("otp-generator")


// admin login controller logic will be here
exports.adminLogin = async (req, res) => {
    const { email, password } = req.body;

    const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json("Enter a valid email and password");
        }

    let admin;
    try {
       admin = AdminSchema.findOne({email: email});
    } catch(err) {
        return res.status(500).json("server error");
    };

    if(!admin) {
        return res.status(404).json("email doesn't exist");
    }
    
    let comparePassword;
    try {
        comparePassword = await bcrypt.compare(password, admin.password);
    } catch (err) {
        return res.status(500).json("Failed to login")
    }
    
    if(comparePassword === false) {
        return res.status(401).json("incorrect password")
    };

    let token;
    try {
        token = jwt.sign({ email: admin.email, id: admin._id},
            process.env.SECRET_TOKEN,
             { expiresIn: 60 * 60 })
    } catch (err) {
        return res.status(403).json("Failed, try login again")
    }

    return res.status(200).json({ token: token, email: admin.email, id: admin._id });
};

exports.userEmail = async (req, res) => {
    const email = req.body.email;

    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json("Enter a valid email");
    }

    let adminEmail;
    try {
        adminEmail = await AdminSchema.findOne({ email })
    } catch(err) {
        return res.status(500).json("Failed, try again later")
    };

    if(!adminEmail) {
        return res.status(404).json("Email doesn't exist");
    };

    const codeGenerator = otpGenerator.generate(6, { upperCaseAlphabets: true, specialChars: false });

    if(codeGenerator === undefined) {
        return res.status(503).json("service unavailable at the moment, please try again.")
    }

    //send user 6 digit code generated to user email for hashing it.

    let hashCode;
    try {
        hashCode = await bcrypt.hash(codeGenerator, 12)
    } catch(err) {
        return res.status(400).json("please try again");
    }

    if(!hashCode) { return res.status(404).json("Could not get your request.") };

    adminEmail.OTP = hashCode;

    let updatedCode;
    try {
        updatedCode = await adminEmail.save()
    } catch(err) {
        return res.status(500).json("server error");
    };

    if(!updatedCode) return res.status(400).json("Failed to change password");

    let token;
    try {
        token = jwt.sign({ email: adminEmail.email, id: adminEmail._id}, 
            process.env.SECRET_TOKEN, { expiresIn: 60 * 60 })
    } catch(err) { return res.status(500).json("Failed") }

    if(!token) {
        return res.status(404).json("token can't be empty.")
    }

    return res.status(200).json({ token: token, id: adminEmail._id })

}

exports.adminResetPassword = (req, res, next) => {
    // const {}
}

// admin get all user controller logic will be here





