const mongoose=require('mongoose')

const wishlist= new mongoose.Schema({

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
        available: {
            type: Boolean,
            default: true 
        }
}]
    
})

module.exports=mongoose.model('Wishlist',wishlist)