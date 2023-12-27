const mongoose=require('mongoose')

const userschema=new mongoose.Schema({
    name:{
        type:String,
        required:true
    },
    email:{
        type:String,
        required:true
    },
    password:{
        type:String,
        required:true
    },
    verified:{
        type:Boolean,
        default:false
    },
    status:{
        type:String,
        default:'Active'
    }

})


module.exports=mongoose.model('User',userschema)

