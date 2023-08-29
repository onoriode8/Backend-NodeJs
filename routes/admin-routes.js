const express = require("express");

const adminControllers = require("../controllers/adminController/admin-operation");

const router = express.Router();

router.get("users", adminControllers.getUsers);

router.put("edit-product/:pid", adminControllers.editUserProductById)


module.exports = router;