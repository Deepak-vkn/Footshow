const { logout } = require("./usercontroll")

const Admin=require('../models/adminmodels')
const User=require('../models/usermodel')
const Product=require('../models/product')
const Category=require('../models/category')
const Cart=require('../models/cart')
const Wishlist=require('../models/wishlist')
const Coupon=require('../models/coupon')
const Order=require('../models/orders')
const bcrypt=require('bcrypt')
const { checkout, render } = require("../routes/adminroute")
const fs = require('fs');
const path = require('path');
const sharp=require('sharp')
const Razorpay= require('razorpay')
const Crypto = require("crypto");
require('dotenv').config();
var instance = new Razorpay({key_id: process.env.key_id, key_secret: process.env.key_secret })





//laod checkout--------------------------------------------------------------------------------


const loadcheckout=async(req,res)=>{
    try {
        const folow=req.query.uid
        let cartcount
        let wishcount
        req.session.folow=folow


     //delete expired offer
        await Product.updateMany(
            { 'offer.endDate': { $lt: new Date() } },
            { $set: { 'offer': null } }
        );
  
        await Category.updateMany({
            'offer.endDate':{$lt:new Date()}},
            {$set:{'offer':null}}
        )




        if( req.session.folow){
            const mail=req.session.userid
            if(mail){
               
            
                const user=await User.findOne({email:mail,verified:true})
                const track=true
                const uid=user._id
                req.session.payment=uid



                    const cart = await Cart.findOne({ userid: uid })
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
                    

                    //update the cart according to the offer---------------------------------

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
                        if (product.productid.offer && product.productid.offer.status) {
                            const originalPrice = product.productid.price;
                            const discountPercentage = product.productid.offer.percentage;
                            const discountAmount = (originalPrice * discountPercentage) / 100;
                            const discountedPrice = originalPrice - discountAmount;
      
                            product.price = discountedPrice;
                            product.totalprice = discountedPrice * product.quantity;
                        } else if (product.productid.category && product.productid.category.offer  && product.productid.category.offer.status) {
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
                  //--------------------------------------------------------------------------------//



                cartcount=cart.products.length
                const wallet= user.wallet
                const total= cart.total
                const wishlist=await Wishlist.findOne({userid:uid})
                if(wishlist){
                    wishcount=wishlist.products.length
                }
        


                // quantity check -------


                const quantityCheck = cart.products.some(cartProduct => {
                    const productQuantityInCart = cartProduct.quantity;
                    const productQuantityInDatabase = cartProduct.productid.quantity;

                    return productQuantityInCart > productQuantityInDatabase;
                });

                if (quantityCheck) {
                    
                    req.flash('error', 'Quantity in cart exceeds available quantity. Please update your cart.');
                    return res.redirect('/cart');
                }

                if(wallet>= total){

                    res.render('checkout',{user,cart,track,wallet,cartcount,wishcount})
                    
                }
                else{
                    res.render('checkout',{user,cart,track,cartcount,wishcount})

                }

    
            }
            else{
                res.redirect('/login')
            }
           
            

        }
        else{
            res.redirect('/cart')
        }
       
       
        

    } catch (error) {
       res.redirect('/500')
    }
}



//payment controll-----------------------------------------------------------------------------------


const payment=async(req,res)=>{
    try {
        
            const index=req.body.selectedValue
            const cid=req.query.cid
            const payment=req.body.selectedPaymentMethod
            const mail= req.session.userid
            const user=await User.findOne({email:mail})
            const cart = await Cart.findById({_id:cid}).populate('products.productid');
            const code=req.body.code
    
            if(user){
            
                const uid=user._id
                const address=user.address[index]
        
                const total= req.body.newtotal || cart.total
                const ordercheck= await Order.findOne({userid:uid})
           
                
                    
                    const productlist=  cart.products.map((product)=>({
                        productid: product.productid,
                        name: product.productid.name, 
                        price: product.price,
                        quantity: product.quantity,
                        totalprice: product.totalprice,
                        image: product.productid.image[0]
    
                    }))

                    //coupon management

                    if(code){
                        const coupon=await Coupon.findOne({code:code})

                        const offer=coupon.offeramount
                        const discount=offer/productlist.length.toFixed(1);

                        productlist.forEach((product)=>{
                            product.price -= parseFloat(discount);
                            product.totalprice=product.price*product.quantity

                        })
                    }




                                    
                    const neworder= new Order({
    
                        userid:uid,
                        products:productlist,
                        address:address,
                        total:total,
                        payment:payment,
                        date:Date.now()
                        
                    })

                    if(payment==='Cash on Delivery')
                    {
                        neworder.products.forEach((product) => {
                            product.status = 'Placed';
                        });
                        neworder.payementstatus='Cash on delivery'
                        const chek=neworder.save()
                    if(chek){


                    
                        await Cart.deleteOne({ _id: cid })
    
                        
                        for (const product of productlist) {
                            const { productid, quantity } = product;
        
                        
                            await Product.updateOne(
                                { _id: productid },
                                { $inc: { quantity: -quantity } }
                            );
                        }

                        if(code){

                            const coupon=await Coupon.findOne({code:code})

                            coupon.useduser.push({
                                userid: uid,
                                usedstatus: true
                            });
                            await coupon.save();

                        }
                        
                        req.session.folow=null
                        res.json({success:true,message: 'Order placed successfully'});
                    }
                    else{
                        res.json({success:false, message: 'Unable to place order'});
                    
                    }

                    }
                    else if(payment==='Razorpay')
                    {
                        
                        const check=neworder.save()
                      
                        if(check){

                                 const razorder= await createRazorpayOrder(neworder._id, neworder.total);
                                if(razorder){


                                    if(code){

                                        const coupon=await Coupon.findOne({code:code})
            
                                        coupon.useduser.push({
                                            userid: uid,
                                            usedstatus: true
                                        });
                                        await coupon.save();
            
                                    }

                                        res.json({razo:true,razorder:razorder})
                                }
                                else{
                                    res.json({success:false, message: 'Unable to place order'})
                    
                                }
                        }
                        else{

                            res.json({success:false, message: 'Unable to place order'})
                    
                        }

                        
                    
                    }
                    else if(payment==='Wallet')
                    {
                        neworder.products.forEach((product) => {
                            product.status = 'Placed';
                        });
                        neworder.payementstatus='Success'
                        const chek=neworder.save()
                    if(chek){

                        user.wallet=user.wallet-total
                        user.save()
                        user.walletHistory.push({
                            amount: total,
                            direction: 'out', 
                        });



                       
                        await Cart.deleteOne({ _id: cid })
    
                        
                        for (const product of productlist) {
                            const { productid, quantity } = product;
        
                        
                            await Product.updateOne(
                                { _id: productid },
                                { $inc: { quantity: -quantity } }
                            );
                        }
                        req.session.folow=null
                        if(code){

                            const coupon=await Coupon.findOne({code:code})

                            coupon.useduser.push({
                                userid: uid,
                                usedstatus: true
                            });
                            await coupon.save();

                        }
                        res.json({success:true,message: 'Order placed successfully'});
                    }
                    else{
                        res.json({success:false, message: 'Unable to place order'});
                    
                    }
                        

                    }
                    else{
                        res.json({success:false, message: 'Unable to place order'})
                    }
                    
            }
            else
            {
                res.json({success:false, error: 'Internal server error' });
    
    
            
            }
       


    
    } catch (error) {
       res.redirect('/500')
    }
}


//order sucess----------------------------------------------------



const ordersuccess=async(req,res)=>{
    try {
        const mail=req.session.userid
        const user=await User.findOne({email:mail,verified:true})
        const uid=user._id
        const order=await Order.findOne({userid:uid}).sort({date:-1}).limit(1)
        
        
        res.render('success',{order})

    } catch (error) {

       res.redirect('/500')
    }
}



// createRazorpayOrder ------------------------------------------------


async function createRazorpayOrder(orderid,total){


    try {
      
        const order = await instance.orders.create({
            amount: total*100, 
            currency: "INR",
            receipt: orderid, 
        });
if(order){

    return order
}
else{
     res.redirect('/cart')
}
    
  
    } catch (error) {
        console.error('Error creating Razorpay order:', error);
        
        throw error;
    }


}



// RAZORPAY verification-------------------------------------------------------------


const verifypayment= async(req,res)=>{

    try {
    
        const {response,razorder}= req.body
    
        const secret=process.env.key_secret
        let hmac = Crypto.createHmac('sha256', secret);
        hmac.update(response.razorpay_order_id + "|" + response.razorpay_payment_id);
        hmac=hmac.digest('hex')
        if ( hmac== response.razorpay_signature) {


            const oid=razorder.receipt
            const order=await Order.findOne({_id:oid})
            if(order){

                const uid= order.userid
                order.products.forEach((product) => {
                    product.status = 'Placed';
                });
                order. payementstatus='Success'
                const check= await order.save()
            
            if(check){
             const cart= await Cart.findOne({userid:uid})
             const productlist= order.products
             for (const product of productlist) {
                const { productid, quantity } = product;

                
                await Product.updateOne(
                    { _id: productid },
                    { $inc: { quantity: -quantity } }
                );
            }
            await Cart.deleteOne({ _id: cart._id })
    
            res.json({success:true,message: 'Order placed successfully'});
           
            }
            else{
    
    
             res.json({success:false,message: 'Order plced but cart not updated'});
            }

            }
            else{
                
    
            res.json({success:false,message: 'Order not found'});
            }
            
            
          }
          else{

            res.json({success:false,message: 'Unbale to verify order'});
          }
        
    } catch (error) {
    
       
       res.redirect('/500')
    }
}



//applycoupon------------------------------------------------------------


const applycoupon=async(req,res)=>{
    try {

        const code=req.query.code
        const mail= req.session.userid
        const user=await User.findOne({email:mail,verified:true})
        const uid=user._id
        const coupon=await Coupon.findOne({code:code,isdelete:false})

        if (coupon) {
            // Check if the coupon is expired
            if (coupon.expireDate < Date.now()) {
                res.json({ success: false, message: 'Coupon has expired' });
            }
             else {
                const checkused = await Coupon.findOne({ code: code, 'useduser.userid': uid });

                if (checkused) {
                    res.json({ success: false, message: 'Coupon already used by user' });
                } else {
                    const cart = await Cart.findOne({ userid: uid });
                    const total = cart.total;
                    const couponmini = coupon.minamount;
                    const offer = coupon.offeramount;

                    if (total < couponmini) {
                        // Check minimum amount
                        res.json({ success: false, message: `You need minimum ₹${couponmini} to apply this coupon` });
                    } else {
                        // Reduce price
                
                        const newtotal = total - offer;
                        res.json({ success: true, newtotal: newtotal, code: code });
                    }
                }
            }
        } else {
            res.json({ success: false, message: 'Coupon not found' });
        }
        
    } catch (error) {
     
       res.redirect('/500')
        
    }
}






module.exports={
    loadcheckout,
    payment,
    ordersuccess,
    verifypayment,
    applycoupon

}




