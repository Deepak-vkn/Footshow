

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



//couponload----------------------------------------------------------------

const couponload=async(req,res)=>{
    try {

        let limit =8
        let totalpage
        let currentPage = parseInt(req.query.page, 10) || 1
        let skip = (currentPage - 1) * limit
        const coupon1=await Coupon.find({isdelete:false})

        totalpage = Math.ceil(coupon1.length / limit);
        

        const coupon=await Coupon.find({isdelete:false}).skip(skip).limit(limit)

        res.render('coupon',{coupon,currentPage,totalpage,skip})
        
    } catch (error) {
        res.redirect('/admin/500')
    }
}


//addcouponlaod----------------------------------------------------------------------------

const addcouponlaod= async(req,res)=>{

    try {

        res.render('addcoupon')
        
    } catch (error) {
        res.redirect('/admin/500')
    }

}



//submit coupon-----------------------------------------------------------------------------

const submitaddcoupon = async (req, res) => {
    try {
        const { name, code, couponDate, description,minAmount,offerAmount } = req.body;

        const existingCoupon = await Coupon.findOne({ code });

        if (existingCoupon) {
            return res.json({ success: false, message: 'Coupon with the same code already exists' });
        }

       
        const newcoupon = new Coupon({
            name:name,
            code:code,
            expireDate: couponDate,
            description:description,
            minamount:minAmount,
            offeramount:offerAmount


        });

        const saved = await newcoupon.save();

        if (saved) {
            res.json({ success: true, message: 'Coupon successfully added' });
        
        } else {
            res.json({ success: false, message: 'Failed to add coupon' });
      
        }
    } catch (error) {

       res.redirect('/admin/500')
    }
};


//loadedit-----------------------------------------------------------------


const loadedit=async(req,res)=>{
    try {
        
        const id=req.query.id
        const coupon=await Coupon.findOne({_id:id})
        res.render('editcoupon',{coupon})
    } catch (error) {
        res.redirect('/admin/500')
    }
}



//editcoupon======================================================

const editcoupon= async(req,res)=>{
    try {
        const { name, code, couponDate ,minAmount,offerAmount,description }=req.body
        const id = req.query.id
        const coupon= await Coupon.findOne({_id:id})

        const existingCoupon = await Coupon.findOne({ code:code,_id: { $ne: id } });

        if (existingCoupon) {
            
            res.render('editcoupon',{message:'Coupon with the same code already exists',coupon})

        }
        else{

            const updated= await Coupon.updateOne(
                {_id:id},
                {$set:{
                    name:name,
                    code:code,
                    expireDate: couponDate,
                    description:description,
                    minamount:minAmount,
                    offeramount:offerAmount
        
    
                }}
                )
                if(updated){
                    res.redirect('/admin/coupon')
    
                }
                else{
                    res.render('editcoupon',{message:'Failed update ',coupon})
    
                }

        }

        

        
    } catch (error) {
        res.redirect('/admin/500')
    }
}



//deletecoupon-------------------------------------------
const deletecoupon = async (req, res) => {
    try {
        const id = req.query.id;


      
        const coupon = await Coupon.findOne({ _id: id });

        if (coupon) {
            
            const deletedCoupon = await Coupon.updateOne({ _id: id },
                {$set:{
                    isdelete:true
                }});

            if (deletedCoupon) {
         
               res.json({ success: true, message: 'Coupon deleted successfully' });
            } else {
                res.json({ success: false, message: 'Failed to delete coupon' });
            }
        } else {
      
                res.json({ success: false, message: 'Failed to delete coupon' });
        }
    } catch (error) {
           
            res.redirect('/admin/500')
    }
};



module.exports={

    couponload,
    addcouponlaod,
    submitaddcoupon,
    loadedit,
    editcoupon,
    deletecoupon,

}