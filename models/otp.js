const mongoose=require('mongoose')


const otpverify= new mongoose.Schema({

    userid:String,
    otp:String,
    createdAt:Date,
    expireAt:Date

})




module.exports=mongoose.model('Otp',otpverify)