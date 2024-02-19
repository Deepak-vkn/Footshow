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





//load  category--------------------------------------------------------------------

const loadcategory=async(req,res)=>{
    try {


       let limit =6
       let totalpage
       let currentPage = parseInt(req.query.page, 10) || 1
       let skip = (currentPage - 1) * limit
       const ca = await Category.find({ is_delete:false})
       totalpage = Math.ceil(ca.length / limit);


        //delte expired offer
       await Product.updateMany(
        { 'offer.endDate': { $lt: new Date() } },
        { $set: { 'offer': null } }
    );

    await Category.updateMany({
        'offer.endDate':{$lt:new Date()}},
        {$set:{'offer':null}}
    )




       const offer = await Offer.find({
        status: true,
        endDate: { $gt: new Date() } 
    });
       
    

        const category= await Category.find({is_delete:false}).populate('offer').limit(limit).skip(skip)
        res.render('category',{category,currentPage,skip,totalpage,offer})
    } catch (error) {
        console.log(error.message);
    }

}
  
// add category--------------------------------------------------------------------

const addcategory=async(req,res)=>{

    try {

        const iid = req.body.name.trim()
        const check = await Category.find({  Category: { 
            $regex: new RegExp("^" + iid.trim() + "$", "i") 
          }  });

    
        if(check.length>0){
            console.log('category exist');
            let message='Category already exist'
            const category= await Category.find({})
            res.render('category',{category,message})

        }
        else{
            const category= await new Category({
                Category:iid,
                Status:req.body.status,
                Description:req.body.Description
                })
        
                if(category){
                    console.log("raeched save");
        
                    await category.save()
                    res.redirect('/admin/category')
                }
                else{
                    let message="Category already exist"
                    res.render()
                    console.log("adding failed");
                }

        }
        
        
    } catch (error) {
        console.log(error.message);
        
    }
}


// laoad add catagery================================

const loaddcata=async(req,res)=>{
    try {

        let limit =6
        let totalpage
        let currentPage = parseInt(req.query.page, 10) || 1
        let skip = (currentPage - 1) * limit
        const ca = await Category.find({ is_delete:false})
        totalpage = Math.ceil(ca.length / limit);
        const offer = await Offer.find({
            status: true,
            endDate: { $gt: new Date() } 
        });

        const id=req.query.id

        const cata= await Category.findOne({_id:id})
        
        const category= await Category.find({is_delete:false}).populate('offer').limit(limit).skip(skip)

        res.render('category',{cata,category,currentPage,skip,totalpage,offer})



    } catch (error) {
        console.log(error.message);
    }
}

//update category=======================================


const updatecata=async(req,res)=>{

    try {
        
        const id=req.body.id
        const cata = req.body.category.trim()
        const newid= await Category.find({_id:id})
        
        
        

        const check = await Category.findOne({ 
            Category: { 
              $regex: new RegExp("^" + cata.trim() + "$", "i") 
            } 
          });
          
       
        if(check){
            const newq= check.id
            if(newq!==id){
              
                let message='Category already exist'
                const category= await Category.find({})
                res.render('category',{category,message})


            }
            else{
              
                const edited= await Category.updateOne({_id:id},{$set:{
                    Category:cata,
                    Status:req.body.status,
                    Description:req.body.Description
                }})
                if(edited){
                  
                    res.redirect('/admin/category')
        
                }
                else
                {
                    console.log('eror in eidt');
                }
            }
            
        }

        else{
            console.log(`status is ${req.body.status}`)
            const edited= await Category.updateOne({_id:id},{$set:{
                Category:req.body.category,
                Status:req.body.status,
                Description:req.body.Description
            
            }})
            
            if(edited){
             
                res.redirect('/admin/category')
    
            }
            else{
                console.log('eror in eidt');
            }

        }

        
       
        
    } catch (error) {
        console.log(error.message);
    }

}



//cataegory block----------------------------------------------------------------------------------------


const catablock=async(req,res)=>{

    try {
        const id= req.query.id
        const user=await Category.findOne({_id:id})
        

        if(user){
        

            await Category.updateOne({_id:id},{$set:{Status:'Blocked'}})
            const category= await Category.find({})
            res.render('category',{category})
           

        }
        else{
            const category= await Category.find({})
            res.render('category',{category})
           
        }

        
    } catch (error) {
        console.log(error.message);
    }

}


// category unblock=============================================


const cataunblock=async(req,res)=>{

    try {
        const id= req.query.id
        const user=await Category.findOne({_id:id})
      

        if(user){
        

            await Category.updateOne({_id:id},{$set:{Status:'Active'}})
            const category= await Category.find({})
            res.render('category',{category})
            

        }
        else{
            const category= await Category.find({})
            res.render('category',{category})
            console.log('unblock failed');
        }

        
    } catch (error) {
        console.log(error.message);
    }

}


//cataegory soft delete===========================================

const catadelete= async(req,res)=>{
    try {
    
        const id=req.query.id
        const cata=await Category.updateOne({_id:id},{$set:{is_delete:true}})
        res.redirect('/admin/category')
        //console.log(cata)

     
    } catch (error) {
        console.log(eror.message);
    }
}



module.exports={

    loadcategory,
    addcategory,
    loaddcata,
    updatecata,
    catablock,
    cataunblock,
    catadelete,
}