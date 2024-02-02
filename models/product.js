const mongoose=require('mongoose')

const productschema= new mongoose.Schema({

    name:{
        type:String,
        required:true
    },
    price:{
        type:String,
        required:true
    },
    gender:{
        type:String,
        required:true
    },
    color:{
        type:String,
        required:true
    },
    size:{
        type:String,
        required:true
    },
    description:{
        type:String,
        required:true
    },
    status:{
        type:String,
        default:'Active',
        required:true
    },
    brand:{
        type:String,
        required:true
    },
    image:{
        type:[String],
        required:true
    },
    category: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Category', 
        required: true
    },
    is_delete:{
        type:Boolean,
        default:false
    },
    quantity:{
        type:Number,
        required:true
    },
    createdAt:{
        type:Date,
        required:true
    }
    
})
 










module.exports=mongoose.model('Product',productschema)