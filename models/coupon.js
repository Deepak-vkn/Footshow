const mongoose=require('mongoose')

const coupon= new mongoose.Schema({

   name:{
    type:String,
    required:true
   },
   code:{
    type:String,
    required:true
   },
   description:{
    type:String,
    required:true
   },
   expireDate:{
    type:Date,
    required:true
   },
   useduser:[{
    userid:{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User', 
        
    },
    usedstatus:{
        type:Boolean,
        default:false
    }
   }],
   minamount:{
    type:Number,
    required:true
   },
   offeramount:{
    type:Number,
    required:true
   },
   isdelete:{
    type:Boolean,
    default:false
   }

   
    
})

module.exports=mongoose.model('Coupon',coupon)