
const Admin=require('../models/adminmodels')
const User=require('../models/usermodel')
const Product=require('../models/product')
const Category=require('../models/category')
const Cart=require('../models/cart')
const Order=require('../models/orders')
const Coupon=require('../models/coupon')
const Offer=require('../models/offer')
const Banner=require('../models/banner')
const bcrypt=require('bcrypt')
const { checkout, render } = require("../routes/adminroute")




//load offer-----------------------------------------------------------------------------------------------

const offerload=async(req,res)=>{
    try {

        let limit =8
        let totalpage
        let currentPage = parseInt(req.query.page, 10) || 1
        let skip = (currentPage - 1) * limit
        const offer1= await Offer.find({status:true})
        totalpage = Math.ceil(offer1.length / limit);
        
        const offer= await Offer.find({status:true}).skip(skip).limit(limit)

        res.render('offer',{offer,currentPage,totalpage,skip})

    } catch (error) {
        res.redirect('/admin/500')
    }
}


//loadaddoffer-----------------------------------------------------------------------------------------------

const loadaddoffer=async(req,res)=>{
    
    try {
        

        res.render('addoffer')

    } catch (error) {
        res.redirect('/admin/500')
    }
}




//offerpost---------------------------------------------------------------------------------------------------------

const offerpost=async(req,res)=>{
    try {
        const formdata=req.body
        const{name,percentage,startDate,endDate}=req.body


        const iid = name.trim()
        const check = await Offer.find({  name: { 
            $regex: new RegExp("^" + iid.trim() + "$", "i") 
          }  });


        if (check) {
            return res.json({ success: false, message: 'Offer with the same code already exists' });
        }

        const newoffer= new Offer({
            name,
            percentage,
            startDate,
            endDate
        })

        const savedoffer= newoffer.save()
        if (savedoffer) {
            res.json({ success: true, message: 'Offer successfully added' });
        
        } else {
            res.json({ success: false, message: 'Failed to add offer' });
      
        }
       

    } catch (error) {
   
        res.redirect('/admin/500')
    }
}


//edit offer load------------------------------------------------------------------


const editofferload=async(req,res)=>{
    try {
        const id=req.query.id
        
        const offer= await Offer.findOne({_id:id})
        
        res.render('editoffer',{offer})

    } catch (error) {
        res.redirect('/admin/500')
    }
}


// editoffer -----------------------------------------------------------------
const editoffer = async (req, res) => {
    try {
        const { name, percentage, startDate, endDate } = req.body;
    


        const id = req.query.id;
        const existingOffer = await Offer.findOne({
            name: { $regex: new RegExp(`^${name}$`, 'i') },
            _id: { $ne: id }
        });
        
           
        if (existingOffer) {
    
            res.json({ success: false, message: 'Offer with the same name already exists' });
        }else {
            const offer = await Offer.findByIdAndUpdate(id, {
                name,
                percentage,
                startDate,
                endDate,
            });

            

            if (offer) {
                res.json({ success: true, message: 'Offer updated successfully' });
            } else {
                const offerDetails = await Offer.findOne({ _id: id });
                res.json({ success: false, message: 'Failed to edit. Please try again.', offer: offerDetails });
            }
        }
    } catch (error) {
        res.redirect('/admin/500');
        
    }
};


//delete offer-------------------------------------------------------------------------------

const deleteoffer = async (req, res) => {
    try {
        const id = req.query.id;
    
    const result = await Offer.deleteOne({ _id: id });

        if (result.deletedCount > 0) {
            
            res.json({ success: true, message: 'Offer deleted successfully' });
        } else {
            
            res.json({ success: false, message: 'Offer not found or could not be deleted' });
        }
    } catch (error) {
        res.redirect('/admin/500');

    }
};





//applyoffer-------------------------------------------------------------------------------------------

const applyoffer=async(req,res)=>{

    try {
        
        const{offerId,productId }=req.body

        const offer=await Offer.findOne({_id:offerId})

        const product=await Product.findOne({_id:productId})

        const applyoffer=  await Product.updateOne(
            { _id: productId },
            { $set: { offer: offerId } }
          );
        if(applyoffer){

            res.json({success:true,message:'Offer applied succesfully'})
        }
        else{
            res.json({success:false,message:'Failed to apply offer'})

        }

    } catch (error) {
     
        res.redirect('/admin/500')
    }
    
}




///removeoffer--------------------------------------------------------

const removeoffer=async(req,res)=>{
    try {
        const pid=req.body.id
        const product=await Product.findOne({_id:pid})
        product.offer=null
        const removeoffer=product.save()
        if(removeoffer){
            res.json({success:true,message:'Removed offer succesfully'})
        }
        else{
            res.json({success:false,message:'Failed to remove offer'})
        }


    } catch (error) {
     
        res.redirect('/admin/500')
    }
}





//applyoffercata-----------------------------------------------------------------------

const applyoffercata=async(req,res)=>{
    try {

        const{offerId,cataId }=req.body

        const offer=await Offer.findOne({_id:offerId})

        const catagery=await Category.findOne({_id:cataId})

       const applyoffer=await Category.updateOne({_id:cataId},
        {$set:{offer:offerId}})
        if(applyoffer){
            res.json({success:true,message:'Offer applied successfully'})
        }
        else{
            res.json({success:false,message:"fialed to apply offer"})
        }
        
    } catch (error) {
       
        res.redirect('/admin/500')
    }
}


//removecataoffer---------------------------------------------------------------------------------------------



const removecataoffer=async(req,res)=>{
    try {
        const cid= req.body.id
        const category=await Category.findOne({_id:cid})
        category.offer=null
       const removed= category.save()
       if(removed)
        {
            res.json({success:true,message:'Offer removed successfully'})

        }
        else{
            res.json({success:false,message:'Failed to remove offer'})

        }



    } catch (error) {
       
        res.redirect('/admin/500')
    }
}










module.exports={
    offerload,
    loadaddoffer,
    offerpost,
    editofferload,
    editoffer,
    deleteoffer,
    applyoffer,
    removeoffer,
    applyoffercata,
    removecataoffer

}