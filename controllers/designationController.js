const Designation = require("../models/designation");



const addDesignation = async (req,res) => {
    try {
        const {des_name, description} = req.body;
        const newDesignation = new Designation({
            des_name,
            description
        })

        await newDesignation.save();
        return res.status(200).json({success:true, Designation:newDesignation})

    } catch (error) {
        console.log(error);
        return res.status(500).json({success:false, error:"add designation server error"})
    }
}


const getDesignation = async (req,res) => {
    try {
        const designation = await Designation.find();
        return res.status(200).json({success:true,designation})
    } catch (error) {
        console.log(error);
        return res.status(500).json({success:false, error:"get designation server error"})
    }
}


const editDesignation = async (req,res) => {
    try {
        const {id} = req.params;
               
        const designation = await Designation.findById({_id:id})
        return res.status(200).json({success:true,designation})
    } catch (error) {
        console.log(error);
        return res.status(500).json({success:false, error:"Edit get designation server error"})
    }
}

const updateDesignation = async (req,res) => {
    try {
        const {id} = req.params;
        const {des_name, description} = req.body;
        const updateDes = await Designation.findByIdAndUpdate({_id:id},{
            des_name,
            description
        })
        return res.status(200).json({success:true,updateDes})
    } catch (error) {
        console.log(error);
        return res.status(500).json({success:false, error:"update get department server error"})
    }
}

module.exports = {addDesignation,getDesignation,editDesignation,updateDesignation}