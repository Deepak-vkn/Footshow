
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
        
        res.render('productlist',{prod})
    } catch (error) {
        res.status(400).send('load product falied');
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
        res.status(400).send('Load add product falied');
    }
}

//add product================================================================


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
        
        const product = await Product.find({_id:id}).populate('category').lean();
      
        const categories = await Category.find();

        

        res.render('editproduct',{product,categories})

    
        
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
const editproduct = async (req, res) => {
    try {
        const id = req.body.id;
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

       

        // Check if 'newImages' and 'replaceImages' are present in req.files
        if (req.files) {
            const newImages = req.files['newImages'];
            const replaceImages = req.files['replaceImages'];

            // Handle replacement images
            if (replaceImages && replaceImages.length > 0) {
                updatedProduct.image = replaceImages.map(file => file.filename);
            } else {
                // No replacement images, check if newImages is present
                updatedProduct.image = (newImages && newImages.length > 0)
                    ? prod.image.concat(newImages.map(file => file.filename))
                    : prod.image;
            }
        }

        // Update the product
        const updatedProd = await Product.updateOne({ _id: id }, { $set: updatedProduct });
        

        if (updatedProd) {
            res.redirect('/admin/productlist');
        } else {
            res.status(500).send('PRODUCT NOT UPDATED');
            console.log('Product not updated');
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