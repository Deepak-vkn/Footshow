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

    }



})

module.exports=mongoose.model('Category',categories)
