const { logout } = require("./usercontroll")

const Admin=require('../models/adminmodels')
const User=require('../models/usermodel')
const Product=require('../models/product')
const Category=require('../models/category')
const Cart=require('../models/cart')
const bcrypt=require('bcrypt')
const { checkout, render } = require("../routes/adminroute")
const fs = require('fs');
const path = require('path');
const sharp=require('sharp')


//add to cart ----------------------------

const addtocart=async(req,res)=>{

    try {
      const id=req.query.id
      const usermail=req.session.userid
      const qty=req.body.qty
      const prdct=await Product.findOne({_id:id})
    //   console.log(prdct)
      if(usermail){
       const user=await User.findOne({email:usermail})
        if(prdct){

            const uid=user._id.toString()
            const cartcheck=await Cart.findOne({userid:uid})
            const price=prdct.price
            const totalprice=price*qty
          
           //chaeck cart exuist  for user or not
            if(cartcheck){
                
                const pcheck=await Cart.findOne({'products.productid':id})//checking whather product alerady in cart or not
                if(pcheck){

                        const existingProductIndex = cartcheck.products.findIndex(product => product.productid.toString() === id);
            
                    
                        const existingProduct = cartcheck.products[existingProductIndex];
                        existingProduct.quantity = Number(existingProduct.quantity) + Number(qty);
                        existingProduct.totalprice = Number(existingProduct.totalprice) + totalprice;
                    
                        const updatedCart = await cartcheck.save();

                if (updatedCart) {
                    res.json({ success: true, message: 'Product details updated in the cart' });
                } else {
                    res.json({ success: false, message: 'Failed to update product details in the cart' });
                }
                }
                else{
                        //console.log('reached cart exist')
                        const cartnew =await Cart.updateOne({userid:uid},{ $push:{
                        products: {
                        productid: id,
                        price: price,
                        quantity: qty,
                        totalprice: totalprice,
                        image:prdct.image[0]
                    }
                   }})
                 
                   if(cartnew){
                    res.json({ success: true, message: 'Product added to cart' });
                   //console.log('added to extsing crt')
                   }
                   else{
                    res.json({ success: false, message: 'Failed to add to cart' });
                  //console.log('failed to add to exsting cart')
                   }
                }
                
                
               


            }
            else{
                //console.log('cart not found')
               //no cart for the crnt user
                const cartnew= new Cart({
                userid:uid,
                products:[
                    {
                        productid:id,
                        price:price,
                        quantity:qty,
                        totalprice:totalprice,
                        image:prdct.image[0]

                    }
                ]
              })
              const c= await cartnew.save()
              if(c){
                res.json({ success: true, message: 'Product added to cart' });
                //console.log('addto cart')
              }
              else{
                res.json({ success: false, message: 'Failed to add to cart' });
                //console.log('failed to add cart')
              }
               
            }
        }

        else{
            res.json({ success: false, message: 'Product not found' });
           //console.log('product not found')
        }
         
        
      }

      else{
        res.json({ success: false, message: 'User not login' });

        //console.log('rediercted to login')
        
      }

    } catch (error) {
        res.json({ success: false, message: 'Failed to add cart' });
        console.log(error.message)
    }

}


//load cart---------------------------------------------------------------

const loadcart=async(req,res)=>{

    try {
        const usermail= req.session.userid

        if(usermail){
        const user= await User.findOne({email:usermail})
        const id=user._id.toString()
        const cart = await Cart.findOne({ userid: id })
        .populate({
          path: 'products.productid',
          model: 'Product',
        })
        .lean();

        if(cart){
            const total=await Cart.aggregate([
                {
                  $unwind: '$products' // Deconstruct the products array
                },
                {
                  $group: {
                    _id: null,
                    total: { $sum: '$products.totalprice' } // Calculate the sum of totalprice
                  }
                },
                {
                  $project: {
                    _id: 0, // Exclude the _id field
                    total: 1 // Include only the total field
                  }
                }])
        //console.log(total.total)
            res.render('cart',{cart,total})
        }
        else{
            res.render('cart')
        }
        }
        else{
            res.redirect('/login')
        }
        
       
        // console.log(`cata is ${cart}`)
        
       
       
    } catch (error) {

        console.log(error.message)
    }
}



//cart update-------------------------------------------------


const updateacart=async(req,res)=>{
    try {
        const id=req.query.id
        const qty=req.body.quantity
        const pid=req.body.productId
        // console.log(`pid ${pid}`)
        // console.log(`qty is ${qty}`)
        const user = await Cart.findOne({_id:id})
        
        const product = user.products.find(p => p.productid.toString() === pid);
        //console.log(product)
        if(product){
            //const totalprice=product.totalprice
            const price=product.price
            const totalprice=qty*price
            const updatedCart = await Cart.findOneAndUpdate(
                { _id: id, 'products.productid': pid },
                {
                  $set: {
                    'products.$.quantity': qty,
                    'products.$.totalprice': totalprice
                  }
                },
                { new: true } // Return the updated document
              );
              //console.log('Updated Cart:', updatedCart);

              if(updatedCart){
                const total=await Cart.aggregate([
                    {
                      $unwind: '$products' // Deconstruct the products array
                    },
                    {
                      $group: {
                        _id: null,
                        total: { $sum: '$products.totalprice' } // Calculate the sum of totalprice
                      }
                    },
                    {
                      $project: {
                        _id: 0, // Exclude the _id field
                        total: 1 // Include only the total field
                      }
                    }])
                    const editedProduct = updatedCart.products.find(p => p.productid.toString() === pid);

                   // console.log(editedProduct )
                    res.status(200).json({ success: true, editedProduct, total });

              }

              else{
                res.status(500).json({ success: false, message: 'Failed to update the cart.' });
              }
        }
        else{
            res.status(404).json({successa:false,message:'Product not found in users Cart'})

        }
       


    } catch (error) {
        res.status(500).json({success:false,message:'Internal Server error'})
        console.log(error.message)
    }
}


//remove a cart--------------------------

const removecart=async(req,res)=>{
    try {


        const pid= req.query.id
        const uid=req.query.uid
        // console.log(pid)
        // console.log(uid)
        const user=await Cart.findOne({_id:uid})
        //console.log(user)

        const updatedcart= await Cart.findOneAndUpdate({_id:uid,},{$pull:{products:{productid:pid}}},{ new: true })
        //console.log(updatedcart)
        console.log(updatedcart.products.length)
        if(updatedcart && updatedcart.products.length<1){
            const deletedCart = await Cart.findOneAndDelete({ _id: uid });


           res.redirect('/cart')
        }
        else{

            res.redirect('/cart')
        }
        
       
        
    } catch (error) {
        console.log(error.message)
    }
}










module.exports= {
    addtocart,
    loadcart,
    updateacart,
    removecart
}


















