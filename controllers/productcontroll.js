
const { logout } = require("./usercontroll")

const Admin=require('../models/adminmodels')
const User=require('../models/usermodel')
const Product=require('../models/product')
const Category=require('../models/category')
const bcrypt=require('bcrypt')
const { checkout, render } = require("../routes/adminroute")
const fs = require('fs');
const path = require('path');






//load product-----------------------------------------------------------------

const loadproduct= async(req,res)=>{
    try {
    
        // const prod= await Product.find({})
        const prod = await Product.find().populate('category').lean();
        const cata = await Category.find({Status:'Active'})        
        res.render('productlist',{prod,cata})
    } catch (error) {
        res.status(400).send('load product falied');
        console.log(error.message);
    }
}



//laod add product============================================================

const loadaddproduct=async(req,res)=>{
    try {

            const category = await Category.find({Status:'Active'})


            res.render('addproduct',{category})

        //console.log(tc)
        
    } catch (error) {
        console.log(error.message);
        res.status(400).send('Load add product falied');
    }
}

//add product================================================================--


const addproduct=async(req,res)=>{
    try {
        console.log(req.body.category);
        const category = await Category.findOne({
            Category: {
                $regex: new RegExp("^" + req.body.category + "$", "i"),
            },
        });
      
        // const category = await Category.findOne({ Category: req.body.category });
        if (!category) {
            // Handle the case where the category is not found
            return res.status(404).send('Category not found');
        }
                 
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
            res.status(400).send('Creating new product falied');
           
        }
        


    } 
    catch (error) {
        res.status(400).send('Creating new product falied');
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
            
            
            res.redirect('/admin/productlist')
        }

        
    } catch (error) {
        res.status(400).send('Block product falied');
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
            res.status(400).send('Unblock product falied');
            
            
            res.redirect('/admin/productlist')
        }

    } catch (error) {
        res.status(400).send('Unblock product falied');
        console.log(error.message);
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
      
            const categories = await Category.find();
            message='Maximum image limit is 4'
            
    
            res.render('editproduct',{product,categories,message})
    
        }
        else{
            const product = await Product.find({_id:id}).populate('category').lean();
      
            const categories = await Category.find();
    
            
    
            res.render('editproduct',{product,categories,message})
    
        }
       
    
        
    } catch (error) {
        res.status(400).send('load edit product falied');
        console.log(error.message);
    }

}
// edit product----------------------------------------------------------------
// const editproduct =async(req,res)=>{
//     try {

//         const id= req.body.id
//         const name=req.body.name
//         const prod = await Product.findOne({_id :id});
       
//         const category = await Category.findOne({ Category: req.body.category });
      
//         const updatedProduct=await Product.updateOne({_id:id},{$set:{
//             name:req.body.name,
//             gender:req.body.gender,
//             price:req.body.price,
//             size:req.body.size,
//             description:req.body.description,
//             brand:req.body.brand,
//             color:req.body.color,
//             status:req.body.status,
//             category:req.body.category
            
            
//         }})

//         // if(eidtedprod){
//         //     res.redirect('/admin/productlist')
//         // }
//         // else{
//         //     console.log('not edited');
//         // }
//         if (req.files && req.files.length > 0) {
//             // Assuming the input field for images is named 'newImages'
//             const newImages = req.files.map(file => file.filename);
//             updatedProduct.image = prod.image.concat(newImages);
//         }

//         // Update the product
//         const updatedProd = await Product.updateOne({ _id: id }, { $set: updatedProduct });

//         if (updatedProd) {
//             res.redirect('/admin/productlist');
//         } else {
//             console.log('Product not updated');
//         }
//     } catch (error) {
//         console.log(error.message);
//         res.status(500).send('Internal server error');
//     }
// };


// const editproduct = async (req, res) => {
//     try {
//         const id = req.body.id;
//         let updatedProd=null
//         const prod = await Product.findOne({ _id: id });
//         const replaceImages = req.files['replaceImages'];
//         const newImages = req.files['newImages'];

//         const category = await Category.findOne({ Category: req.body.category });

//         const updatedProduct = {
//             name: req.body.name,
//             gender: req.body.gender,
//             price: req.body.price,
//             size: req.body.size,
//             description: req.body.description,
//             brand: req.body.brand,
//             color: req.body.color,
//             status: req.body.status,
//             category: req.body.category,
            
//         };

       

       
//         if (replaceImages) {
            
            

//             // Check if the total number of images exceeds the limit
//             const totalImagesCount = (replaceImages ? replaceImages.length : 0);
//             const maxImages = 4;
            

//             if (totalImagesCount > maxImages) {
//                let msg=true
//                 console.log('maximum limit exeeded')
//                 res.redirect(`/admin/editproduct?id=${id}&msg=${msg}`);
            
//                //return res.status(400).send(`Exceeded maximum allowed images (${maxImages})`);
//             }

//             else{

//                 updatedProduct.image = replaceImages.map(image => image.filename);
            
//                 updatedProd = await Product.updateOne({ _id: id }, { $set: updatedProduct });
//                 console.log('Existing Product (After Update):', await Product.findOne({ _id: id }));
//                 console.log('Reached updateProd:', updatedProd);
                 
//                  if (updatedProd) {
//                  console.log('Reached updateProd:', updatedProd);
//                  res.redirect('/admin/productlist');
//                  } 
//                     else {
//                  res.status(500).send('PRODUCT NOT UPDATED');
//                  //console.log('Product not updated');
        
//                 }
//               }


//             }
//         else{ 
//                 updatedProd = await Product.updateOne({ _id: id }, { $set: updatedProduct });
//                 if (updatedProd) {
//                 console.log('Reached updateProd:', updatedProd);
//                 res.redirect('/admin/productlist');
//                 } 
//                  else {
//                 res.status(500).send('PRODUCT NOT UPDATED');
//                 //console.log('Product not updated');
//                  }

        


        
//     } 
        
//  }
//  catch (error) {
//         console.error(error);
//         res.status(500).send('Error processing images');
//     }
// };

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
        };

        const newImages = req.files['newImages'];
        const replaceImages = req.files['replaceImages'];

        // Handle replacement images
        if (replaceImages && replaceImages.length > 0) {
            updatedProduct.image = replaceImages.map(file => file.filename);
        } else {
            // No replacement images, append new images to the existing ones
            // updatedProduct.image = prod.image.concat(newImages.map(file => file.filename));
            updatedProduct.image = newImages ? prod.image.concat(newImages.map(file => file.filename)) : prod.image;
        }

        // Update the product
        const updatedProd = await Product.updateOne({ _id: id }, { $set: updatedProduct });

        if (updatedProd) {
            res.redirect('/admin/productlist');
            
        } else {
            console.log('Product not updated');
            res.status(500).send('Internal server error and Prodcut not updated');
        }
    } catch (error) {
        console.log(error.message);
        res.status(500).send('Internal server error');
    }
};


//delete image------------------------------------------------



const deleteimage = async (req, res) => {
    try {
        const index = req.query.index;

        // Assuming you have a product object with an 'image' property
        const product = await Product.findOne({ _id: req.query.id });

        // Check if the product is found
        if (!product) {
            return res.status(404).send('Product not found');
        }

        // Check if the index is valid
        if (index >= 0 && index < product.image.length) {
            // Get the filename of the image at the specified index
            const filenameToDelete = product.image[index];

            // Construct the file path
            const filePath = path.join(__dirname, '../public/images', filenameToDelete);

            // Delete the file
            fs.unlinkSync(filePath);

            // Update the database to remove the image reference
            await Product.findByIdAndUpdate(product._id, { $pull: { image: filenameToDelete } });

            // Send a success response
            res.redirect(`/admin/editproduct?id=${req.query.id}`);
            
        } else {
            // Send an error response if the index is out of bounds
            res.status(400).send('Invalid index');
        }
    } catch (error) {
        console.log(error.message);
        res.status(500).send('Internal Server Error');
    }
};




module.exports={
    loadproduct,
    loadaddproduct,
    addproduct,
    blockproduct,
    productunblock,
    loadeditproduct,
    editproduct,
    deleteimage

    

}