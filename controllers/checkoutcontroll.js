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
                        payment:payment
                    })
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
            else{
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

        res.render('success')

    } catch (error) {

        console.log(error.message)
    }
}

module.exports={
    loadcheckout,
    payment,
    ordersuccess

}




