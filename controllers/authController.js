const User = require('../models/user')
const bcrypt = require('bcrypt')
const jwt = require('jsonwebtoken')

const login = async (req, res, next) => {
    const {email,password} = req.body;
    const user = await User.findOne({email})
    if(!user){
        return res.status(404).json({success:true, message:"user Not Found"})
    }

    const isMatch = await bcrypt.compare(password,user.password)
    if(!isMatch){
        return res.status(404).json({success:true, message:"Wrong password"})
    }

    const token = jwt.sign({_id: user._id, role:user.role},process.env.JWT_PASS, {expiresIn:"1d"})
    res.status(200).json({success:true, token, user: {_id:user._id, name:user.name, role:user.role}})
}

const verify = async(req,res) =>{
   return res.status(200).json({success:true, user:req.user})
}

module.exports={login, verify}