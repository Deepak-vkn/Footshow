const mongoose=require('mongoose')


const otpverify= new mongoose.Schema({

    userid:{
        type:String,
        required:true
    },
    otp:{
        type:String,
        required:true
    },
    createdAt:{
        type:Date,
        required:true
    },

    expireAt:{
        type:Date,
        required:true
    }
    

})




module.exports=mongoose.model('Otp',otpverify)