const { logout } = require("./usercontroll")

const Admin=require('../models/adminmodels')
const User=require('../models/usermodel')
const Product=require('../models/product')
const Category=require('../models/category')
const Wishlist=require('../models/wishlist')
const Cart=require('../models/cart')
const bcrypt=require('bcrypt')
const { checkout, render } = require("../routes/adminroute")
const fs = require('fs');
const path = require('path');
const sharp=require('sharp')
const Coupon=require('../models/coupon')
const Offer=require('../models/offer')

//add to cart ----------------------------

const addtocart=async(req,res)=>{

    try {


      //delte expired offer
      await Product.updateMany(
        { 'offer.endDate': { $lt: new Date() } },
        { $set: { 'offer': null } }
    );

    await Category.updateMany({
        'offer.endDate':{$lt:new Date()}},
        {$set:{'offer':null}}
    )


      const id=req.query.id
      const usermail=req.session.userid
      const qty=req.body.qty
      let price

      const prdct = await Product.findOne({_id: id})
      .populate({
          path: 'category',
          populate: {
              path: 'offer',
              model: 'Offer',
          },
      })
      .populate('offer')
      .lean();
  
   
      if(usermail){
       
       const user=await User.findOne({email:usermail,verified:true})
        if(prdct){
          const qtycheck=prdct.quantity
          
          if(qtycheck===0){
            res.json({ success: false, message: ' Product Out of Stock' });
           
            return 
          }
          else{

  
            const uid=user._id.toString()
            const cartcheck=await Cart.findOne({userid:uid})
            let price = prdct.price; // Default to the original price

        if (prdct.offer) {
            const originalPrice = prdct.price;
            const discountPercentage = prdct.offer.percentage;
            const discountAmount = (originalPrice * discountPercentage) / 100;
            const discountedPrice = originalPrice - discountAmount;
            price = discountedPrice;
        } else if (prdct.category && prdct.category.offer) {
            const originalPrice = prdct.price;
            const discountPercentage = prdct.category.offer.percentage;
            const discountAmount = (originalPrice * discountPercentage) / 100;
            const discountedPrice = originalPrice - discountAmount;
            price = discountedPrice;
        }
           
            const totalprice=price*qty
          
           //chaeck cart exuist  for user or not
            if(cartcheck){
                
                const pcheck=await Cart.findOne({'products.productid':id})
                if(pcheck){

                        const existingProductIndex = cartcheck.products.findIndex(product => product.productid.toString() === id);
            
                    
                        const existingProduct = cartcheck.products[existingProductIndex];
                        updatedQuantity = Number(existingProduct.quantity) + Number(qty);
                        
                    
                        if (updatedQuantity >= qtycheck) {
                          res.json({ success: false, message: 'Quantity limit exceeded' });
                          return;
                      }

                      if (updatedQuantity > 10) {
                          res.json({ success: false, message: 'Quantity in cart exceeds 10' });
                          return;
                      }

                        existingProduct.quantity = updatedQuantity;
                        existingProduct.totalprice = Number(existingProduct.totalprice) + totalprice;
                        cartcheck.total=cartcheck.total+totalprice 
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
                    },

                   }})
                    
                    cartcheck.total = cartcheck.total+totalprice

                    const updatedCart = await cartcheck.save();
                  let count=1
                 
                   if(cartnew){
                    res.json({ success: true, message: 'Product added to cart',count });
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
                ],
                total:totalprice
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
          

        }

        else{
            res.json({ success: false, message: 'Product not found' });
           //console.log('product not found')
        }
         
        
      }

      else{
        console.log('user not login')
        res.json({ success: false, message: 'User not login' });

        //console.log('rediercted to login')
        
      }

    } catch (error) {
      console.log('error in catch')
        res.json({ success: false, message: 'Failed to add cart' });
        console.log(error.message)
    }

}


//load cart---------------------------------------------------------------
const loadcart = async (req, res) => {
  try {
      const usermail = req.session.userid;
      let wishcount;
      let cartcount;

      // Delete expired offer
      await Product.updateMany(
          { 'offer.endDate': { $lt: new Date() } },
          { $set: { 'offer': null } }
      );

      await Category.updateMany({
          'offer.endDate': { $lt: new Date() }
      }, {
          $set: { 'offer': null }
      });

      if (usermail) {
          const track = true;
          const user = await User.findOne({ email: usermail });
          const id = user._id.toString();

          const cart = await Cart.findOne({ userid: id })
              .populate({
                  path: 'products.productid',
                  model: 'Product',
                  populate: [
                      {
                          path: 'category',
                          model: 'Category',
                          populate: {
                              path: 'offer',
                              model: 'Offer',
                          },
                      },
                      { path: 'offer', model: 'Offer' },
                  ],
              });

          const wishlist = await Wishlist.findOne({ userid: id });
          if (wishlist) {
              wishcount = wishlist.products.length;
          }

          if (cart) {
              for (const cartProduct of cart.products) {
                  const product = cartProduct.productid;

                  if (product.offer) {
                      const productOfferEndDate = new Date(product.offer.endDate);

                      if (productOfferEndDate < new Date()) {
                          await Product.findByIdAndUpdate(product._id, { $set: { offer: null } });
                      }
                  }

                  if (product.category && product.category.offer) {
                      const categoryOfferEndDate = new Date(product.category.offer.endDate);

                      if (categoryOfferEndDate < new Date()) {
                          await Category.findByIdAndUpdate(product.category._id, { $set: { offer: null } });
                      }
                  }
              }

              cart.products.forEach((product) => {
                  if (product.productid.offer) {
                      const originalPrice = product.productid.price;
                      const discountPercentage = product.productid.offer.percentage;
                      const discountAmount = (originalPrice * discountPercentage) / 100;
                      const discountedPrice = originalPrice - discountAmount;

                      product.price = discountedPrice;
                      product.totalprice = discountedPrice * product.quantity;
                  } else if (product.productid.category && product.productid.category.offer) {
                      const originalPrice = product.productid.price;
                      const discountPercentage = product.productid.category.offer.percentage;
                      const discountAmount = (originalPrice * discountPercentage) / 100;
                      const discountedPrice = originalPrice - discountAmount;

                      product.price = discountedPrice;
                      product.totalprice = discountedPrice * product.quantity;
                  } else {
                      product.price = product.productid.price;
                      product.totalprice = product.price * product.quantity;
                  }
              });

              await cart.save();
              cart.total = cart.products.reduce((total,product) => {
                
                return total + product.totalprice;
            }, 0);
            await cart.save()

              const total = cart.total;
              const cartcount = cart.products.length;

              res.render('cart', { cart, total, track, user, cartcount, wishcount });
          } else {
              res.render('cart', { track, user, wishcount });
          }
      } else {
          res.redirect('/login');
      }

  } catch (error) {
      console.log(error.message);
      // Handle the error as needed
      res.status(500).send('Internal Server Error');
  }
};


//cart update-------------------------------------------------


const updateacart=async(req,res)=>{
    try {


        //delte expired offer
        await Product.updateMany(
          { 'offer.endDate': { $lt: new Date() } },
          { $set: { 'offer': null } }
      );
  
      await Category.updateMany({
          'offer.endDate':{$lt:new Date()}},
          {$set:{'offer':null}}
      )

        const id=req.query.id
        const qty=req.body.quantity
        const pid=req.body.productId
        let price
        const user = await Cart.findOne({_id:id})


        
        const product = await Product.findOne({ _id: pid })
        .populate({
            path: 'category',
            populate: {
                path: 'offer',
                model: 'Offer',
            },
        })
        .populate('offer')
        .lean();

        //console.log(product)
        if(product){
            const dbproduct= await Product.findOne({_id:pid})

            const oldquantity= dbproduct.quantity -1
           if(oldquantity<qty){
            
            res.json({ success: false, message: 'Product out of stock' });
           }
           else{
            
            if(product.offer){
              const originalPrice = product.price;
              const discountPercentage = product.offer.percentage;
              const discountAmount = (originalPrice * discountPercentage) / 100;
              const discountedPrice = originalPrice - discountAmount;
              price=discountedPrice
            }
            else if(product.category.offer){
              const originalPrice = product.price;
              const discountPercentage = product.category.offer.percentage;
              const discountAmount = (originalPrice * discountPercentage) / 100;
              const discountedPrice = originalPrice - discountAmount;
              price=discountedPrice

            }
            else{

              price=product.price
            }

           


            const totalprice=qty*price
            const updatedCart = await Cart.findOneAndUpdate(
                { _id: id, 'products.productid': pid },
                {
                  $set: {
                    'products.$.quantity': qty,
                    'products.$.totalprice': totalprice
                  }
                },
                { new: true } 
              );
              //console.log('Updated Cart:', updatedCart);

              if(updatedCart){
                const cart=await Cart.findOne({_id:id})
                const total = updatedCart.products.reduce((acc, p) => acc + p.totalprice, 0);
                await Cart.updateOne({ _id: id }, { $set: { total: total } });
               



                    const editedProduct = updatedCart.products.find(p => p.productid.toString() === pid);

                   // console.log(editedProduct )
                    res.status(200).json({ success: true, editedProduct, total });

              }

              else{
                res.status(500).json({ success: false, message: 'Failed to update the cart.' });
              }
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
          const newTotalPrice = updatedcart.products.reduce(
            (total, product) => total + product.totalprice,
            0
          );
        
          // Update the total price in the cart
          updatedcart.total = newTotalPrice;
        
          // Save the updated cart
          await updatedcart.save();
        
            res.redirect('/cart')
        }
        
       
        
    } catch (error) {
        console.log(error.message)
    }
}




//stockcheck==========================


const stockcheck=async(req,res)=>{
    try {
        
        const newqty= req.body.newQuantity
        const pid=req.query.pid
        // console.log(qty)
        // console.log(pid)
        const product= await Product.findOne({_id:pid})
        const oldquantity=product.quantity -1
        //console.log(oldquantity)
        if(oldquantity<newqty ){
        res.json({success:false})
        }
        else{
        res.json({success:true})
        }



    } catch (error) {
        res.json({success:false})
        console.log(error.message)
    }
}





module.exports= {
    addtocart,
    loadcart,
    updateacart,
    removecart,
    stockcheck
}


















