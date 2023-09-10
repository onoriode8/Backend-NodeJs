const jwt = require("jsonwebtoken");

module.exports = (req, res, next) => {
    console.log("line 4", req.headers.authorization.split(" ")[1])
    console.log("authorize", req.headers.authorization);
    try { 
       const token = req.headers.authorization.split(" ")[1] // "Bearer " + token
       console.log("line 7 token", token);
       if(!token) {
          throw new Error("Unauthorized");
       };
       console.log("line 11 token", token)

       const decodedToken = jwt.verify(token, process.env.SECRET_TOKEN);
       console.log("line 14 verify token", decodedToken);
       req.reqBody = { email: decodedToken.email, id: decodedToken.id };
       next();
    } catch(err) {
        return res.status(401).json("Authentication failed");
    };

    

   
};