
const { logout } = require("./usercontroll")

const Admin=require('../models/adminmodels')
const User=require('../models/usermodel')
const Product=require('../models/product')
const Category=require('../models/category')
const bcrypt=require('bcrypt')
const { checkout, render } = require("../routes/adminroute")






//load product-----------------------------------------------------------------

const loadproduct= async(req,res)=>{
    try {
    
        // const prod= await Product.find({})
        const prod = await Product.find().populate('category').lean();
        console.log(prod);
        res.render('productlist',{prod})
    } catch (error) {
        console.log(error.message);
    }
}



//laod add product============================================================

const loadaddproduct=async(req,res)=>{
    try {
        const category = await Category.find({})

        
        res.render('addproduct',{category})
    } catch (error) {
        console.log(error.message);
    }
}

//add product================================================================


const addproduct=async(req,res)=>{
    try {
      
        const category = await Category.findOne({ Category: req.body.category });
                 
           const images = req.files.map(file => file.filename);
            
        const product= await new Product({
            name:req.body.name,
            gender:req.body.gender,
            price:req.body.price,
            size:req.body.size,
            description:req.body.description,
            brand:req.body.brand,
            color:req.body.color,
            status:req.body.status,
            image:images,
            category:category._id

            })

        const saved= await product.save()
        if(saved){
        
            res.redirect('/admin/productlist')
        }
        else{
            console.log('not saves');
        }
        


    } 
    catch (error) {
        console.log(error.message);
    }
}


//block product=====================================

const blockproduct=async(req,res)=>{
    try {
        const id= req.query.id
        const prod=await Product.findOne({_id:id})
       

        if(prod){
        

            await Product.updateOne({_id:id},{$set:{status:'Blocked'}})
            res.redirect('/admin/productlist')

        }
        else{
            
            console.log('block failed');
            res.redirect('/admin/productlist')
        }

        
    } catch (error) {
        console.log(error.message);
    }
}


// product unblock=============================================

const productunblock=async(req,res)=>{
    try {
        
        const id= req.query.id
        const prod=await Product.findOne({_id:id})
       

        if(prod){
        

            await Product.updateOne({_id:id},{$set:{status:'Active'}})
            res.redirect('/admin/productlist')

        }
        else{
            
            console.log('unblock failed');
            res.redirect('/admin/productlist')
        }

    } catch (error) {
        console.log(error.message);
    }
}

//load edit product================================================

const loadeditproduct=async(req,res)=>{

    try {

        const product=await Product.find({})

        res.render('editproduct',{product})

    
        
    } catch (error) {
        console.log(error.message);
    }

}



module.exports={
    loadproduct,
    loadaddproduct,
    addproduct,
    blockproduct,
    productunblock,
   loadeditproduct

}