const express = require("express");


const routes = express.Router();

routes.use((req, res, next) => {
    return res.status(404).json("Page not found");
});

module.exports = routes;