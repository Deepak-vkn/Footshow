const mongoose=require('mongoose')


const categories= mongoose.Schema({


    Category:{
        type:String,
        required:true

    },
    Description:{
        type:String,
        required:true

    },
    Status:{
        type:String,
        default:'Active'

    },
    is_delete:{
        type:Boolean,
        default:false
    }



})

module.exports=mongoose.model('Category',categories)
