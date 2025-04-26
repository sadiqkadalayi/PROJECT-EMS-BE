var mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
    name:{type:String, required:true},
    email:{type:String, required:true, unique:true},
    password:{type:String},
    role:{type:String, 
        enum:["superAdmin","manager","admin","supervisor","employee","hr","assist"],required:true},
    profileImage:{type:String},
    createdAt: {type:Date, default:Date.now},
    updatedAt: {type:Date, default:Date.now},
})

const User = mongoose.model("User", userSchema)
module.exports=User