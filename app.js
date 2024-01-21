const express = require('express');
const mongoose = require('mongoose');
const cors = require("cors")
const userRoutes = require("./routes/user-routes");
const errorController = require("./controllers/error");
const adminRoutes = require("./routes/admin-routes");

// const PORT =  5000;


const server = express();
 
server.use(express.json());


server.use((req, res, next) => {
    res.setHeader("Access-Control-Allow-Origin", "*");
    res.setHeader("Access-Control-Allow-Methods", "POST, PATCH, GET, DELETE");
    res.setHeader("Access-Control-Allow-Headers", "Authorization, Content-Type");
    next();
}); 

server.use(cors())

server.use(userRoutes); 

server.use("/admin", adminRoutes) // work on the connection later with the routes and controller and admin model

server.use(errorController); 

const url = `mongodb+srv://${process.env.DB_NAME}:${process.env.DB_PASSWORD}@cluster0.xhbwvcs.mongodb.net/${process.env.COLLECTION}?retryWrites=true&w=majority`;

mongoose.connect(url)
    .then(res => {
        server.listen(process.env.PORT, () => {
            console.log(`app is serving on http://localhost:${process.env.PORT}`);
        })
    })
    .catch(err => { 
        // console.log("error occur"); 
    });
