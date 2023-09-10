const AdminSchema = require("../../models/adminModel/adminSchema");
const { validationResult } = require("express-validator");
const nodeMailer = require("nodemailer")
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
             { expiresIn: '1h' })
    } catch (err) {
        return res.status(403).json("Failed, try login again")
    }

    return res.status(200).json({ token: token, email: admin.email, id: admin._id });
};

exports.userEmail = async (req, res, next) => {
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

    //send user 6 digit code generated to user email before hashing it.
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
        to: adminEmail.email,
        subject: '(OSB) onlineshop',
        text: 
        `Hi ${adminEmail.email}. We detect someone trying to login into your account, ignore if this is you. Otherwise protect your account from hackers. (OSB) onlineshop, your 6 digit OTP code
         ${codeGenerator}`
      };

      await mailTransporter.sendMail(mailOptions, function(err, data) {
        if (err) {
           return res.status(502).json(err);
        } 
      });

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
        return res.status(500).json("internal server error");
    };

    if(!updatedCode) return res.status(400).json("Failed to change password");

    updatedCode.password = undefined;

    let token;
    try {
        token = jwt.sign({ email: adminEmail.email, id: adminEmail._id}, 
            process.env.SECRET_TOKEN, { expiresIn: "1h" })
    } catch(err) { return res.status(500).json("Failed") }

    if(!token) {
        return res.status(404).json("token can't be empty.")
    }

    return res.status(200).json({ token: token, id: adminEmail._id })

};

// code send from frontend to validate otp check.
exports.passCode = async (req, res, next) => {
    const code = req.body.code;

    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json("Enter a valid password");
    };

    // console.log("line 150 token verify email sent", req.reqBody.email);

    let response;
    try {
        response = await AdminSchema.findOne({ email: req.reqBody.email }); //add request from verify token here.
    } catch(err){
        return res.status(500).json("internal server error")
    };

    if(response === undefined || response === null) {
        return res.status(404).json("user not found");
    }

    let hashedCode;
    try {
        hashedCode = await bcrypt.compare(code, response.OTP)
    } catch(err) {
        return res.status(400).json("Failed to compare codes, try again later");
    }

    if(!hashedCode) {
        return res.status(403).json("Failed to compare codes, try again later")
    }

    response.password = undefined;

    let token;
    try {
        token = jwt.sign({ email: response.email, id: response._id}, 
            process.env.SECRET_TOKEN, { expiresIn: "1h" })
    } catch(err) { return res.status(500).json("Failed") }

    return res.status(200).json({ email: response.email, id: response._id, token: token });

}

exports.adminResetPassword = async (req, res, next) => {
    const { password, confirmedPassword } = req.body;

    const errors = validationResult(req);
    if(!errors.isEmpty()) {
        return res.status(422).json("Enter a valid password");
    };

    if(password !== confirmedPassword) {
        return res.status(406).json("not acceptable, both password must match");
    }

    let response;
    try {
        response = await AdminSchema.findOne({ email: req.reqBody.email });
    } catch(err) {
        return res.status(500).json("server error");
    }

    if(!response) { return res.status(404).json("user not found") };

    let hashedPassword;
    try {
        hashedPassword = await bcrypt.hash(password, 12);
    } catch(err) {
        return res.status(500).json("Failed to secure password, try again later");
    };
    // console.log("password line 213", hashedPassword)

    if(hashedPassword === undefined || hashedPassword === null) {
        return res.status(404).json("password can't be null");
    }

    response.password = hashedPassword;

    try {
        const data = await response.save();
        if(!data) {
            throw new Error("Failed to update password");
        }
        return res.status(200).json("password updated successful");
    } catch(err) {
        return res.status(500).json("server error");
    };
};