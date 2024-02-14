const mongoose=require('mongoose')

const offer= new mongoose.Schema({

   name:{
    type:String,
    required:true
   },
   percentage:{
    type:Number,
    required:true
   },
   startDate:{
    type:String,
    required:true
   },
   endDate:{
    type:Date,
    required:true
   },
   status:{
    type:Boolean,
    default:true
   }

   
    
})

module.exports=mongoose.model('Offer',offer)