const express = require('express');
const mongoose = require('mongoose');

const userRoutes = require("./routes/user-routes");
const errorController = require("./controllers/error");

const PORT =  5000


const server = express();
 
server.use(express.json());


server.use((req, res, next) => {
    res.setHeader("Access-Control-Allow-Origin", "*");
    res.setHeader("Access-Control-Allow-Methods", "POST, PUT, GET, DELETE");
    res.setHeader("Access-Control-Allow-Headers", "Authorization, Content-Type");
    next();
}); 

server.use(userRoutes); 

// server.use(adminRoutes) // work on the connection later with the routes and controller and admin model

server.use(errorController); 


// server.listen(PORT);

// add new collection name testing and document name Mern to database.    aZ7Rudh2IiNhjifg

// const url = 'mongodb+srv://testing:eU0Lcc5mA3JFCdQ1@cluster0.xhbwvcs.mongodb.net/Mern?retryWrites=true&w=majority';

const url = `mongodb+srv://${process.env.DB_NAME}:${process.env.DB_PASSWORD}@cluster0.xhbwvcs.mongodb.net/${process.env.COLLECTION}?retryWrites=true&w=majority`;

mongoose.connect(url)
    .then(res => {
        server.listen(PORT, () => {
            console.log(`app is serving on http://localhost:${PORT}`);
        })
    })
    .catch(err => { 
        console.log("error occur"); 
    });

// try {
//     mongoose.connect(url).then(res => {
//         server.listen(PORT, ()=> {
//             console.log(`app is running on http://localhost:${PORT}/`);
//         })
//     })
// } catch(err) {
//     console.log("Error");
// }