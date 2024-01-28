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
    },
    address:[{
        name:{ 
            type: String,
            required: true

        },
        buildingname:{
            type: String,
            required: true

        },
        mobile:{ 
            type: String,
            required: true

        },
        street: {
            type: String,
            required: true
        },
        city: {
            type: String,
            required: true
        },
        state: {
            type: String,
            required: true
        },
        pincode: {
            type: String,
            required: true
        }

    }],
    wallet:{
        type:Number,
        default:0
    }

})


module.exports=mongoose.model('User',userschema)

