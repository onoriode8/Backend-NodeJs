const AdminSchema = require("../../models/adminModel/adminSchema");

// admin get all user ===> single user at a time, controller logic will be here
exports.getUsers = async (req, res, next) => {
    
    let adminUser;
    try {
        adminUser = await AdminSchema.find();
    } catch(err) {
        return res.status(500).json("Failed, try again later")
    };

    if(!adminUser) {
        return res.status(404).json("Email doesn't exist");
    };

    adminUser.password = undefined;
    adminUser.OTP = undefined;

    return res.status(200).json(adminUser);

}


// admin update user product or goods by id controller logic will be here
exports.editUserProductById = (req, res, next) => {
    const id = req.params.pid;
};