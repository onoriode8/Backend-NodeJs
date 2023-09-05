const validator = require("express-validator");

exports.email = (req, res, next) => {
    console.log("validator",validator.body())
    return validator.body("email")
    .isEmail()
    .withMessage("Please Enter A Valid Email")
    .isLength({ max: 320 })
    .withMessage("Password must contain up to 320 characters")
    .normalizeEmail();
}