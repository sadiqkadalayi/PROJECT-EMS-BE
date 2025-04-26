
const jwt = require('jsonwebtoken');
const User = require('../models/user');


const verifyUser = async (req,res,next) => {
    try {
        const token = req.headers.authorization.split(' ')[1];
        if(!token){
            return res.status(404).json({sucess:false, error : "Token Not provided"})
        }

        const decode = jwt.verify(token,process.env.JWT_PASS)
        console.log(decode);
        
        if(!decode){
            return res.status(404).json({sucess:false, error : "Token Not Valid"})
        }

        const user = await User.findById({_id: decode._id}).select('-password')
        if(!user){
            return res.status(404).json({sucess:false, error : "User Not Found"})
        }

        req.user = user;
        next();

    } catch (error) {
        return res.status(500).json({sucess:false, error : "server side error"})
    }
}

module.exports = {verifyUser}