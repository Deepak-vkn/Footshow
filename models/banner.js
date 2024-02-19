const mongoose=require('mongoose')


const banner= new mongoose.Schema({

    name:{
        type:String,
        required:true
    },
    description:{
        type:String,
        required:true
    },
    image:{
        type:[String],
        required:true
    },
    isdelete:{
        type:Boolean,
        default:true
    }
})



module.exports=mongoose.model('Banner',banner)