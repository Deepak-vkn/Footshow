const mongoose=require('mongoose')

const order= new mongoose.Schema({

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
        name:{
            type:String,
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
            
        },
        status:{
            type:String,
            default:'Pending'
        },
        return:{
            type:String
        }
        

}],
    address:{
        type:String,
        required:true
    },
    total:{
        type:Number,
        required:true
    },
    payment:{
        type:String,
        required:true
    },
    date:{
        type:Date,
        required:true
    }


})

module.exports=mongoose.model('Order',order)