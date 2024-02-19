
const Admin=require('../models/adminmodels')
const User=require('../models/usermodel')
const Product=require('../models/product')
const Category=require('../models/category')
const Cart=require('../models/cart')
const Order=require('../models/orders')
const Coupon=require('../models/coupon')
const Offer=require('../models/offer')
const Banner=require('../models/banner')
const bcrypt=require('bcrypt')
const { checkout, render } = require("../routes/adminroute")




// load orders--------------------------------------------



const loadorder=async(req,res)=>{

    try {

       let limit =8
       let totalpage
       let currentPage = parseInt(req.query.page, 10) || 1
       let skip = (currentPage - 1) * limit
       const od = await Order.find()
       totalpage = Math.ceil(od.length / limit);


        const order= await Order.find().sort({date:-1}).skip(skip).limit(limit)
        const delted=await Order.deleteMany({payementstatus:'Pending'})
      
        res.render('orders',{order,totalpage,skip,currentPage})
    } catch (error) {
        console.log(error.message)
        
    }

}


// update status-------------------------------------------------------


const orderstatus=async(req,res)=>{

    try {
        const { status, orderId,productIndex}=req.body
       
        const order= await Order.findOne({_id:orderId})
       
        if(order){
            const updatedorder= order.products[productIndex].status = status;
            const isAllProductsDelivered = order.products.every(product => product.status === 'Delivered');

                if (order.payment === 'Cash on Delivery' && isAllProductsDelivered) {
                    order.payementstatus = 'Success';
                }
                await order.save();
        res.json({success:true,message:"Status Updated"})

        }
        else{
            res.json({success:false,message:"Order not found"})
             //ordr not  found
        }
        
    } catch (error) {
        res.json({success:false,message:"Failed to update status"})

        console.log(error.message)
    }
}





//returnrequest------------------------------------------------


const returnrequest= async(req,res)=>{
    try {
        

        const{ orderId, productIndex, reason }= req.body
        //console.log( orderId, productIndex, reason )

        const order= await Order.findOne({_id:orderId})
        //console.log(`order is ${order}`)
        const paymentmethod= order.payment
        if(paymentmethod=='Cash on Delivery'){
             //cod

           order.products[productIndex].status='Returned'
           order.total=order.total-order.products[productIndex].totalprice
           const updated= await order.save()
           if(updated){
            res.json({success:true,message:'Request approved'})
            
           }
           else{
            res.json({success:false,message:'Failed to approve request'})
           }

        }

        //razorpay or wallet managemnt
        else{

            const uid=order.userid
            const user= await User.findOne({_id:uid})
            
           const total=order.products[productIndex].totalprice
           
            order.products[productIndex].status='Returned'
            order.total=order.total-order.products[productIndex].totalprice
           const updated= await order.save()
           if(updated){

            if(user){

                const refund= order.products[productIndex].totalprice

                user.wallet= user.wallet+refund
                const refunded= user.save()




                if(refunded){
                    //sucss refund
                    user.walletHistory.push({
                        amount:total,
                        direction: 'in', 
                    });


                    res.json({success:true,message:'Request approved and refund initiated'})
                }
                else{

                    res.json({success:false,message:'Request approved,but Fialed to initiate refund'})
                    // failed refund
                }
                //user found
            }
            else{

                res.json({success:false,message:'Request approved,but Fialed to initiate refund,user not found'})
                //user not found
            }


           }
           else{
            res.json({success:false,message:'Failed to approve request'})
           }
            


            //rozor // wallet
        }
    } catch (error) {
        res.json({success:false,message:'Internal server error'})
        console.log(error.message)
    }
}





module.exports={

    loadorder,
    orderstatus,
    returnrequest,

}