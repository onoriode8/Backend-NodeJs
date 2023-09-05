const express = require("express");
const { body } = require('express-validator');
const adminControllers = require("../controllers/adminController/admin-operation");
const adminAuthentication = require("../controllers/adminController/admin-authentication");
// const expressValidator = require("../middlewares/express-validator");
const AdminSchema = require("../models/adminModel/adminSchema")

const router = express.Router();

router.post("/adminLogin", body('email').isEmail().normalizeEmail(),
      body('password').isLength({  min: 6 }), adminAuthentication.adminLogin);

router.post("/signup", async (req, res) => {
    const create = new AdminSchema({
        email: req.body.email,
        password: req.body.password,
        OTP: "h23kn5"
    })

    let user = await create.save()
    if(user === undefined) return res.send("Failed")
    return res.status(200).send({ user })
});

//admin email to change password
router.post("/email", body('email').isEmail().normalizeEmail(), adminAuthentication.userEmail)

router.patch('/change/:userId', adminAuthentication.adminResetPassword);


router.get("/users", adminControllers.getUsers);

router.put("/edit-product/:pid", adminControllers.editUserProductById)


module.exports = router;