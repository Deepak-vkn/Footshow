const { logout } = require("./usercontroll")

const Admin=require('../models/adminmodels')
const User=require('../models/usermodel')
const Product=require('../models/product')
const Category=require('../models/category')
const Cart=require('../models/cart')
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

console.log(process.env.key_id);
console.log(process.env.key_secret);
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
                //console.log(cart)
                res.render('checkout',{user,cart,track})
    
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
            //const cart=await Cart.findOne({_id:cid})
            const cart = await Cart.findById({_id:cid}).populate('products.productid');
            //console.log(user)
            if(user){
                //user exist
                const uid=user._id
                const address=user.address[index]
                //console.log(address)
                const total= cart.total
                const ordercheck= await Order.findOne({userid:uid})
    
                
                
                    //NewORDER
                    const productlist=  cart.products.map((product)=>({
                        productid: product.productid,
                        name: product.productid.name, 
                        price: product.price,
                        quantity: product.quantity,
                        totalprice: product.totalprice,
                        image: product.productid.image[0]
    
                    }))
                                    
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
                        neworder.status='Placed'
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

                                        res.json({razo:true,razorder:razorder})
                                }
                                else{
                                    //error in creatinf razopay order
                                }
                        }
                        else{
                            //not created
                        }

                        
                    console.log('reached razopay')
                    }
                    else
                    {
                        console.log('eror')

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
            amount: total*100, // Amount in paise (multiply by 100)
            currency: "INR",
            receipt: orderid, // Unique identifier for the order
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
                order.status='Placed'
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









module.exports={
    loadcheckout,
    payment,
    ordersuccess,
    verifypayment

}




