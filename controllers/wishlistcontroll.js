const { log } = require('console')
const User=require('../models/usermodel')
const Product=require('../models/product')
const Cart=require('../models/cart')
const Order=require('../models/orders')
const Wishlist=require('../models/wishlist')
const bcrypt=require('bcrypt')
const Otp=require('../models/otp')
const OTPgenerator=require('otp-generator')
const Category=require('../models/category')
const nodemailer=require('nodemailer')
const SendmailTransport = require('nodemailer/lib/sendmail-transport')




const addtowishlist= async(req,res)=>{
    try {
        const mail=req.session.userid
        const user=await User.findOne({email:mail,verified:true})
        const pid= req.body.productId
          
        //delete expired offer
        await Product.updateMany(
            { 'offer.endDate': { $lt: new Date() } },
            { $set: { 'offer': null } }
        );
  
        await Category.updateMany({
            'offer.endDate':{$lt:new Date()}},
            {$set:{'offer':null}}
        )


        if(user){
            const uid= user._id

            const wishlist= await Wishlist.findOne({userid:uid})
            if (wishlist) {


                const isProductInWishlist = wishlist.products.some(product => product.productid.toString() === pid.toString());

                if (isProductInWishlist) {
                    res.json({ success: false, message: 'Product is already in the wishlist' });
                    return;
                }
                // Wishlist exists, push the new product ID
                wishlist.products.push({ productid: pid });
                const updatedWishlist = await wishlist.save();

                if (updatedWishlist) {
                    res.json({ success: true, message: 'Product added to wishlist' });
                } else {
                    res.json({ success: false, message: 'Failed to update wishlist' });
                }
            }
            else{

                // careate new

                 const newWishlist = new Wishlist({
                    userid: uid,
                    products: [{ productid: pid }],
                });

                const savedWishlist = await newWishlist.save();

                if (savedWishlist) {
                    res.json({ success: true, message: 'Product added to wishlist' });
                } 
                else {
                    res.json({ success: false, message: 'Failed to create wishlist' });
                }
            
            }
            
        }
        
        else{
            res.json({ success: false, message: 'User not login' });
        }
        
    } catch (error) {
        res.json({ success: false, message: 'Internal server error' });
        console.log(error.message)
    }
}


// load wishlist---------------------------------------


const loadwishlist= async(req,res)=>{
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

        const mail= req.session.userid
        const user= await User.findOne({email:mail})
        let wishcount

         //delete expired offer
         await Product.updateMany(
            { 'offer.endDate': { $lt: new Date() } },
            { $set: { 'offer': null } }
        );
  
        await Category.updateMany({
            'offer.endDate':{$lt:new Date()}},
            {$set:{'offer':null}}
        )

 
        if(user){

            const uid= user._id
            const track=true
            let cartcount
            const wishlist = await Wishlist.findOne({ userid: uid })
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
            const cart=await Cart.findOne({userid:uid})

            if(cart){
                cartcount=cart.products.length
            }
            
            if (wishlist) {
                wishcount=wishlist.products.length
            
                for (const product of wishlist.products) {
                
                  const productDetails = await Product.findById(product.productid);
        
                  
                  if (productDetails && productDetails.quantity > 0) {
                    product.available = true;
                  } else {
                    product.available = false;
                  }
                }

            
            
        
                
                await wishlist.save();
                res.render('wishlist', { wishlist,cartcount,track,user,wishcount});
              }
            else{
                res.render('wishlist',{cartcount,track,user,wishcount})

            }

            
        }
        else{
            res.redirect('/login')
        }
       
    } catch (error) {
        console.log(error.message)
    }
}

// add to cart------------------------------------------------------------



const addtocart= async(req,res)=>{
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


        const pid= req.query.id 
        const mail= req.session.userid
        const user= await User.findOne({email:mail,verified:true})
        const uid=user._id
        const product= await Product.findOne({_id:pid}).populate({
          path: 'category',
          populate: {
              path: 'offer',
              model: 'Offer',
          },
      })
      .populate('offer')
      .lean();


        const wishlist= await Wishlist.findOne({userid:uid})
        if(product){
            
            const qtycheck=product.quantity

            let price = product.price;

            if (product.offer) {
                const originalPrice = product.price;
                const discountPercentage = product.offer.percentage;
                const discountAmount = (originalPrice * discountPercentage) / 100;
                const discountedPrice = originalPrice - discountAmount;
                price = discountedPrice;
            } else if (product.category && product.category.offer) {
                const originalPrice = product.price;
                const discountPercentage = product.category.offer.percentage;
                const discountAmount = (originalPrice * discountPercentage) / 100;
                const discountedPrice = originalPrice - discountAmount;
                price = discountedPrice;
            }

            // const price = parseInt(product.price, 10);


            const cart= await Cart.findOne({userid:uid})

            
            if(cart){
                //cart exist

                const pcheck=await Cart.findOne({'products.productid':pid})
                if(pcheck){

                        const existingProductIndex = cart.products.findIndex(product => product.productid.toString() === pid);
            
                    
                        const existingProduct = cart.products[existingProductIndex];
                        updatedQuantity = Number(existingProduct.quantity) + 1;
                        
                    
                        if (updatedQuantity >= qtycheck) {
                          res.json({ success: false, message: 'Quantity limit exceeded' });
                          return;
                      }

                      if (updatedQuantity > 10) {
                          res.json({ success: false, message: 'Quantity in cart exceeds 10' });
                          return;
                      }

                        existingProduct.quantity = updatedQuantity;
                        existingProduct.totalprice = Number(existingProduct.totalprice) + price;
                        cart.total=cart.total+price 
                        const updatedCart = await cart.save();

                if (updatedCart) {

                    wishlist.products = wishlist.products.filter(
                        (prdct) => prdct.productid.toString() !== pid
                    );
    
                    await wishlist.save();
                    if (wishlist.products.length < 1) {
                    
                        await Wishlist.deleteOne({ userid: uid })
                    }
                    res.json({ success: true, message: 'Product details updated in the cart' });
                } else {
                    res.json({ success: false, message: 'Failed to update product details in the cart' });
                }
                }

                else{
                        //console.log('proct dont exist in cart')
                        const cartnew =await Cart.updateOne({userid:uid},{ $push:{
                        products: {
                        productid: pid,
                        price: price,
                        quantity: 1,
                        totalprice: price,
                        image:product.image[0]
                    },

                   }})
                
                   cart.total = cart.total+price

                    const updatedCart = await cart.save();
                 
                   if(cartnew){
                    wishlist.products = wishlist.products.filter(
                        (prdct) => prdct.productid.toString() !== pid
                    );
    
                    await wishlist.save();
                    if (wishlist.products.length < 1) {
                    
                        await Wishlist.deleteOne({ userid: uid })
                    }
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
                //no cart

                const cartnew= new Cart({
                    userid:uid,
                    products:[
                        {
                            productid:pid,
                            price:price,
                            quantity:1,
                            totalprice:price,
                            image:product.image[0]
    
                        }
                    ],
                    total:price
                  })
                  const c= await cartnew.save()
                  if(c){

                    wishlist.products = wishlist.products.filter(
                        (prdct) => prdct.productid.toString() !== pid
                    );
    
                    await wishlist.save();
                    if (wishlist.products.length < 1) {
                    
                        await Wishlist.deleteOne({ userid: uid })
                    }
                    res.json({ success: true, message: 'Product added to cart' });
                    //console.log('addto cart')
                  }
                  else{
                    res.json({ success: false, message: 'Failed to add to cart' });
                    //console.log('failed to add cart'
                  }
                
            }
        }
        else{
            res.json({ success: false, message: 'Product not found' });
            //no product
        }

        
    } catch (error) {
        console.log(error.message)
    }
}


// removewishlist --------------------------------------------------------------------

const removewishlist = async (req, res) => {

    try {

        const pid = req.query.pid
        const mail = req.session.userid
        const user = await User.findOne({ email: mail })
        if (user) {
            const uid = user._id

            const product = await Product.findOne({ _id: pid })
            const wishlist = await Wishlist.findOne({ userid: uid })
            if (wishlist) {
                //wishlist found

                const update = await Wishlist.updateOne(
                    { userid: uid },
                    { $pull: { products: { productid: pid } } }
                );
                if (update) {
                    if (wishlist.products.length < 1) {
                        cosnole.log('enetr delete')
                        await Wishlist.deleteOne({ userid: uid })
                    }
                    res.json({ success: true, message: 'Product Removed from wishlist' })
                } else {
                    res.json({ success: false, message: 'Failed to remove product' })
                }

            } else {
                res.json({ success: false, message: 'Wishlist not found' })
                //wishlist not found
            }

        } else {
            res.json({ success: false, message: 'User not login' })

        }

    } catch (error) {
        res.json({ success: false, message: 'Internal server error' })
        console.log(error.message)
    }
}




module.exports={
    addtowishlist,
    loadwishlist,
    addtocart,
    removewishlist
}














