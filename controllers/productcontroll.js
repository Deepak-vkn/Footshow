
const { logout } = require("./usercontroll")

const Admin=require('../models/adminmodels')
const User=require('../models/usermodel')
const Product=require('../models/product')
const Category=require('../models/category')
const bcrypt=require('bcrypt')
const { checkout, render } = require("../routes/adminroute")
const fs = require('fs');
const path = require('path');
const sharp=require('sharp')
const Coupon=require('../models/coupon')
const Offer=require('../models/offer')




//load product-----------------------------------------------------------------

const loadproduct= async(req,res)=>{
    try {

        let limit =6
        let totalpage
       let currentPage = parseInt(req.query.page, 10) || 1
       let skip = (currentPage - 1) * limit
       const product = await Product.find({is_delete:false})
       totalpage = Math.ceil(product.length / limit);

        //delete expired offer
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
    

        const prod = await Product.find({is_delete:false}).populate('category').populate('offer')
        .skip(skip)
        .limit(limit)
        .lean().
        sort({createdAt:-1})
      
     
        const cata = await Category.find({Status:'Active'})        
        res.render('productlist',{prod,cata,currentPage,skip,totalpage,offer})
    } catch (error) {
        res.redirect('/admin/500')
    }
}



//laod add product============================================================

const loadaddproduct=async(req,res)=>{
    try {

            const category = await Category.find({Status:'Active'})


            res.render('addproduct',{category})

        
        
    } catch (error) {
        res.redirect('/admin/500')
    }
}

//add product================================================================--


const addproduct=async(req,res)=>{
    try {
        const images = req.files ? req.files.map(file => file.filename) : [];
        console.log(req.body.category)
        const c=await Category.findOne({Category:req.body.category})
    
        const category = await Category.findOne({
            Category: {
                $regex: new RegExp("^" + req.body.category + "$", "i"),
            },
        });
       

        
        if (!category) {
    
            return res.status(404).send('Category not found');
        }
                 

      

            
        const product= await new Product({
            name:req.body.name,
            gender:req.body.gender,
            price:req.body.price,
            size:req.body.size,
            description:req.body.description,
            brand:req.body.brand,
            color:req.body.color,
            status:req.body.status,
            category:category._id,
            quantity:req.body.quantity,
            createdAt:Date.now()

            })
            

        if (images.length > 0) {
            const remainingSlots = 4 - product.image.length;
            const imagesToPush = images.slice(0, remainingSlots);
            
            for (let i = 0; i < imagesToPush.length; i++) {
                const originalImagePath = path.join(__dirname, '../public/images', imagesToPush[i]);
                const resizedPath = path.join(__dirname, '../public/images', `resized_${imagesToPush[i]}`);

                // Resize image using sharp
                await sharp(originalImagePath)
                    .resize(800, 1070, { fit: 'fill' })
                    .toFile(resizedPath);

                
                product.image.push(`resized_${imagesToPush[i]}`);
            } 
        }
        
        const saved = await product.save();
        if(saved){
        
        
            res.redirect('/admin/productlist')
        }
        else{
            res.status(400).send('Creating new product falied');
           
        }
        


    } 
    catch (error) {
        console.log(error.message)
        res.redirect('/admin/500')
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
            
            
            res.redirect('/admin/productlist')
        }

        
    } catch (error) {
        res.redirect('/admin/500')
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
            res.status(400).send('Unblock product falied');
            
            
            res.redirect('/admin/productlist')
        }

    } catch (error) {
        res.redirect('/admin/500')
    }
}

//product soft delete =============================================

const deleteproduct=async(req,res)=>{
    try {
    
        const id=req.query.id
        const cata=await Product.updateOne({_id:id},{$set:{is_delete:true}})
        res.redirect('/admin/productlist')
    

     
    } catch (error) {
        console.log(eror.message);
    }
}

//load edit product================================================

const loadeditproduct=async(req,res)=>{

    try {


        const id=req.query.id
        let message
        const msg=req.query.msg
        if(msg){
            const product = await Product.find({_id:id}).populate('category').lean();
      
            const categories = await Category.find({is_delete:false});
            message='Maximum image limit is 4'
            
    
            res.render('editproduct',{product,categories,message})
    
        }
        else{
            const product = await Product.find({_id:id}).populate('category').lean();
           
      
            const categories = await Category.find({is_delete:false});
    
            res.render('editproduct',{product,categories,message})
    
        }
       
    
        
    } catch (error) {
        res.redirect('/admin/500')
    }

}


// edit product----------------------------------------------------------------

const editproduct = async (req, res) => {
    try {
        const id = req.body.id;
        const name = req.body.name;
        const prod = await Product.findOne({ _id: id });
        const category = await Category.findOne({ Category: req.body.category });

        const updatedProduct = {
            name: req.body.name,
            gender: req.body.gender,
            price: req.body.price,
            size: req.body.size,
            description: req.body.description,
            brand: req.body.brand,
            color: req.body.color,
            status: req.body.status,
            category: req.body.category,
            quantity:req.body.quantity,
            createdAt:Date.now()

        };

        const newImages = req.files['newImages'];
        const replaceImages = req.files['replaceImages'];

        // Handle replacement images
        if (replaceImages && replaceImages.length > 0) {
            for (const file of replaceImages) {
                const originalImagePath = path.join(__dirname, '../public/images', file.filename);
                const resizedPath = path.join(__dirname, '../public/images', `resized_${file.filename}`);

             
                await sharp(originalImagePath)
                    .resize(800, 1070, { fit: 'fill' })
                    .toFile(resizedPath);
                updatedProduct.image = [`resized_${file.filename}`];
            }

    
        } else {
            updatedProduct.image = [...prod.image, ...(newImages ? await Promise.all(newImages.map(async (file) => {
                const originalImagePath = path.join(__dirname, '../public/images', file.filename);
                const resizedPath = path.join(__dirname, '../public/images', `resized_${file.filename}`);

                
                await sharp(originalImagePath)
                    .resize(800, 1070, { fit: 'fill' })
                    .toFile(resizedPath);

    
                return `resized_${file.filename}`;
            })) : [])];
        }

    
        const updatedProd = await Product.updateOne({ _id: id }, { $set: updatedProduct });

        if (updatedProd) {
            res.redirect('/admin/productlist');
            
        } else {
            console.log('Product not updated');
            res.status(500).send('Internal server error and Prodcut not updated');6
        }
    } catch (error) {
        res.redirect('/admin/500')
    }
};


//delete image------------------------------------------------



const deleteimage = async (req, res) => {
    try {
        const index = req.query.index;

        
        const product = await Product.findOne({ _id: req.query.id });

    
        if (!product) {
            return res.status(404).send('Product not found');
        }

    
        if (index >= 0 && index < product.image.length) {
    
            const filenameToDelete = product.image[index];

            
            const filePath = path.join(__dirname, '../public/images', filenameToDelete);

        
            fs.unlinkSync(filePath);

            
            await Product.findByIdAndUpdate(product._id, { $pull: { image: filenameToDelete } });

        
            res.redirect(`/admin/editproduct?id=${req.query.id}`);
            
        } else {
    
            res.status(400).send('Invalid index');
        }
    } catch (error) {
        
        res.redirect('/admin/500')
    }
};




module.exports={
    loadproduct,
    loadaddproduct,
    addproduct,
    blockproduct,
    productunblock,
    deleteproduct,
    loadeditproduct,
    editproduct,
    deleteimage
    
}