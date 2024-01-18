const mongoose=require('mongoose')

const cart= new mongoose.Schema({

    userid:{
        type: mongoose.Schema.Types.ObjectId,
        ref:'User',
        required:true
    },
    products:[{
        productid:{
            type: mongoose.Schema.Types.ObjectId,
            ref:'Product',
            required:true

        },
        price:{
            type:Number,
            required:true

        },
        quantity:{
            type:Number,
            required:true
        },
        totalprice:{
            type:Number,
            required:true
        },
        image:{
            type:String,
            required:true
            
        }

}]


})

module.exports=mongoose.model('Cart',cart)