const { logout } = require("./usercontroll")

const Admin=require('../models/adminmodels')
const User=require('../models/usermodel')
const Product=require('../models/product')
const Category=require('../models/category')
const Cart=require('../models/cart')
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


const loadcheckout=async(req,res)=>{
    try {
        const folow=req.query.uid
        req.session.folow=folow
        if( req.session.folow){
            const mail=req.session.userid
            if(mail){
               
                //console.log(mail)
                const user=await User.findOne({email:mail,verified:true})
                const track=true
                const uid=user._id
                req.session.payment=uid

                const cart= await Cart.findOne({userid:uid}).populate('products.productid').lean();

                const wallet= user.wallet
                const total= cart.total
        


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


                    res.render('checkout',{user,cart,track,wallet})
                    
                }
                else{
                    res.render('checkout',{user,cart,track})

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
        console.log(error.message)
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
                //user exist
                const uid=user._id
                const address=user.address[index]
                //console.log(address)
                const total= req.body.newtotal || cart.total
                const ordercheck= await Order.findOne({userid:uid})
    
                console.log(total)
                
                    //NewORDER
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
                        console.log('raehed code')
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
                        const chek=neworder.save()
                    if(chek){


                       //console.log('saved')
                        await Cart.deleteOne({ _id: cid })
    
                        
                        for (const product of productlist) {
                            const { productid, quantity } = product;
        
                            // Update each product's quantity
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
                        //console.log('error')
                    }

                    }
                    else if(payment==='Razorpay')
                    {
                        
                        const check=neworder.save()
                      
                        if(check){

                                 const razorder= await  await createRazorpayOrder(neworder._id, neworder.total);
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
                                    //error in creatinf razopay order
                                }
                        }
                        else{

                            res.json({success:false, message: 'Unable to place order'})
                            //not created
                        }

                        
                    
                    }
                    else if(payment==='Wallet')
                    {
                        neworder.products.forEach((product) => {
                            product.status = 'Placed';
                        });
                        const chek=neworder.save()
                    if(chek){

                        user.wallet=user.wallet-total
                        user.save()



                       //console.log('saved')
                        await Cart.deleteOne({ _id: cid })
    
                        
                        for (const product of productlist) {
                            const { productid, quantity } = product;
        
                            // Update each product's quantity
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
                        //console.log('error')
                    }
                        

                    }
                    else{
                        res.json({success:false, message: 'Unable to place order'})
                    }
                    
            }
            else
            {
                res.json({success:false, error: 'Internal server error' });
    
    
                //no user
            }
       


    
    } catch (error) {
        console.log(error.message)
    }
}


//order sucess----------------------------------------------------



const ordersuccess=async(req,res)=>{
    try {
        const mail=req.session.userid
        const user=await User.findOne({email:mail,verified:true})
        const uid=user._id
        const order=await Order.findOne({userid:uid}).sort({date:-1}).limit(1)
        console.log(order)
        
        res.render('success',{order})

    } catch (error) {

        console.log(error.message)
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
    console.log('craeted order')
    return order
}
else{
console.log('failed to crate order')
}
        // Returning the Razorpay order ID if successful
  
    } catch (error) {
        // Handling errors and logging them
        console.error('Error creating Razorpay order:', error);
        
        // Rethrowing the error to propagate it
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
                const check= await order.save()
            
            if(check){
             const cart= await Cart.findOne({userid:uid})
             const productlist= order.products
             for (const product of productlist) {
                const { productid, quantity } = product;

                // Update each product's quantity
                await Product.updateOne(
                    { _id: productid },
                    { $inc: { quantity: -quantity } }
                );
            }
            await Cart.deleteOne({ _id: cart._id })
            console.log('1')
            res.json({success:true,message: 'Order placed successfully'});
           
            }
            else{
                console.log('2')
            // not updated cart
             res.json({success:false,message: 'Order plced but cart not updated'});
            }

            }
            else{
                console.log('3')
            //no roder found   
            res.json({success:false,message: 'Order not found'});
            }
            
            
          }
          else{
            console.log('4')
            res.json({success:false,message: 'Unbale to verify order'});
          }
        
    } catch (error) {
        console.log('5')
        res.json({success:false,message: 'internal server error'});
        console.log(error.message)
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

        if(coupon){
            const checkused=await Coupon.findOne({code:code,'useduser.userid':uid})
           if(checkused){
            res.json({success:false,message:'Coupon already used by user'})

           }
           else{
            const cart=await Cart.findOne({userid:uid})
            const total=cart.total
            const couponmini=coupon.minamount
            const offer=coupon.offeramount
            if(total<couponmini){
                //cehchk mini amount
                res.json({success:false,message:`You need minimum ₹${couponmini} to apply this coupon`})
            }
            else{
            //reduce price
            console.log('reduced price')
            const newtotal=total-offer
            res.json({success:true,newtotal:newtotal,code:code})

            }
            //res.json({success:true})

           }



        }
        else{
            res.json({success:false,message:'Coupon not found'})

        }
        
    } catch (error) {
        res.json({success:false,message:'internal server error'})
        console.log(error.message)
        
    }
}






module.exports={
    loadcheckout,
    payment,
    ordersuccess,
    verifypayment,
    applycoupon

}




