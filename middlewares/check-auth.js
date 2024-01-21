const jwt = require("jsonwebtoken");

module.exports = (req, res, next) => {
    try { 
       const token = req.headers.authorization.split(" ")[1]  //["Bearer " + token]
        if(!token) {
            throw new Error("Unauthorized");
        };
       jwt.verify(token, process.env.SECRET_TOKEN, (err, decodedToken) => {
            if(err) {
                return res.status(408).json("Request timeout, token expires. please try again later");
            }
            req.reqBody = { email: decodedToken.email, id: decodedToken.id };
            next();
       });
    } catch(err) {
        return res.status(401).json("Authentication failed");
    };

    

   
};