const Department = require("../models/departments");


const getDepartment = async (req,res,next)=> {
    try {
        const department = await Department.find();
        return res.status(200).json({success:true,department})
    } catch (error) {
        console.log(error);
        return res.status(500).json({success:false, error:"get department server error"})
    }
}

const addDepartment = async (req,res,next)=> {
    try {
        const {dep_name, description} = req.body;
        const newDep = new Department({
            // dep_name:dep_name,
            // description:description
            dep_name,
            description
        })
        await newDep.save();
        return res.status(200).json({success:true, Department:newDep})
    } catch (error) {
        console.log(error);
        return res.status(500).json({success:false, error:"add department server error"})
        
    }
}

const editDepartment = async (req,res,next) =>{
    try {
        const {id} = req.params;
        console.log(id);
        
        const department = await Department.findById({_id:id})
        return res.status(200).json({success:true,department})
    } catch (error) {
        console.log(error);
        return res.status(500).json({success:false, error:"Edit get department server error"})
    }
}

const updateDepartment = async (req,res) =>{
    try {
        const {id} = req.params;
        const {dep_name, description} = req.body;
        const updateDep = await Department.findByIdAndUpdate({_id:id},{
            dep_name,
            description
        })
        return res.status(200).json({success:true,updateDep})
    } catch (error) {
        console.log(error);
        return res.status(500).json({success:false, error:"update get department server error"})
    }
}

// const deleteDepartment = async(req,res) =>{
//     try {
//         const {id} = req.params;
        
//         const deleteDep = await Department.findByIdAndDelete({_id:id})
        
//         return res.status(200).json({success:true,deleteDep})
//     } catch (error) {
//         console.log(error);
//         return res.status(500).json({success:false, error:"delete get department server error"})
//     }
// }

const deleteDepartment = async(req,res) =>{
    try {
        const {id} = req.params;
        
        const deleteDep = await Department.findById({_id:id})
        await deleteDep.deleteOne()
        
        return res.status(200).json({success:true,deleteDep})
    } catch (error) {
        console.log(error);
        return res.status(500).json({success:false, error:"delete get department server error"})
    }
}

module.exports={addDepartment, getDepartment,editDepartment,updateDepartment,deleteDepartment}