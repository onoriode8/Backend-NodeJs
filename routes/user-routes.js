const express = require("express");

const userController = require("../controllers/userController/auth");
const resetPasswordController = require("../controllers/userController/reset-password");


const router = express.Router();
 
router.post("/authentication", userController.login);  //passed done with this REST API 

router.post("/signup", userController.signup);  //passed done with this REST API 


//reset pass logic below
router.post("/resetPassword/getCode", resetPasswordController.getCode);  // is a put() not a post request change later

router.post("/:user/change_password", resetPasswordController.changePassword);

//watch out for this route. if it will ever reach.
router.post("/:username/password_reset", resetPasswordController.sendCode);

module.exports = router;