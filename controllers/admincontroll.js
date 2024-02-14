

const Admin=require('../models/adminmodels')
const User=require('../models/usermodel')
const Product=require('../models/product')
const Category=require('../models/category')
const Cart=require('../models/cart')
const Order=require('../models/orders')
const Coupon=require('../models/coupon')
const Offer=require('../models/offer')
const bcrypt=require('bcrypt')
const { checkout, render } = require("../routes/adminroute")

//load login------------------------------------------

const loadlogin=async(req,res)=>{

    try {
        res.render('login')
    } catch (error) {
        console.log(error.message);
        
    }
}

//password hashing------------------------------------------------------


const passwordhash=async(password)=>{


    const hashed=await bcrypt.hash(password,10)
    return hashed
}

//login verify---------------------------------------

const loginverify=async(req,res)=>{
    try {
        
        const mail=req.body.email
        const password=req.body.password
        const admin=await Admin.findOne({email:mail})

        if(admin){

            const adminpass=admin.password

            const passwordcomapre=await bcrypt.compare(password,adminpass)

            if(passwordcomapre){

                req.session.admintrack=mail
                console.log(req.session.admintrack);
                
                res.redirect('/admin/dashboard')
            }
            else{
                let message="Incorrect Username and Password"
                res.render('login',{message})
            }
        }
        else{
            let message="Incorrect Username and Password"
            res.render('login',{message})
        }




    } catch (error) {
        console.log(error.message);
    }
}
////////////////////////////////////////////////////////////////////////////////////////////
const laoddashbaord=async(re,res)=>{
    try {

        const revenue = await Order.aggregate([
            {
              $unwind: '$products'
            },
            {
              $match: {
                'products.status': 'Delivered'
              }
            },
            {
              $group: {
                _id: null,
                total: { $sum: '$total' }
              }
            }
          ]);
          
         
           
       
        const totalorder=await Order.find().count()

        const products=await Order.aggregate([
            {$unwind:'$products' },
            {$group:{_id:null,total:{$sum:'$products.quantity'}}}
            
        ])
        const catagery=await Category.find().count()
        const availableproducts=await Product.find({ is_delete:false}).count()
        const totalproducts = revenue.length > 0 ? products[0].total : 0;
        const totalRevenue = revenue.length > 0 ? revenue[0].total : 0;
        const currentDate = new Date();
       
        const monthlySales = await Order.aggregate([
            {
              $match: {
                date: {
                  $gte: new Date(new Date().getFullYear(), new Date().getMonth(), 1),
                  $lt: new Date(new Date().getFullYear(), new Date().getMonth() + 1, 1)
                }
              }
            },
            {
              $unwind: '$products'
            },
            {
              $match: {
                'products.status': 'Delivered'
              }
            },
            {
              $group: {
                _id: { $month: '$date' },
                total: { $sum: '$total' },
                totalOrders: { $sum: 1 },
                productStatus: { $push: '$products.status' }
              }
            },
            {
              $project: {
                _id: 0,
                month: '$_id',
                total: 1,
                totalOrders: 1,
                productStatus: 1
              }
            },
            {
              $sort: {
                month: 1
              }
            }
          ]);
          
          console.log('Monthly sales with product status:', monthlySales);
          

     
        const monthlyUserRegistrations = await User.aggregate([
            {
                $match: {
                    date: {
                        $gte: new Date(new Date().getFullYear(), new Date().getMonth(), 1),
                        $lt: new Date(new Date().getFullYear(), new Date().getMonth() + 1, 1)
                    }
                }
            },
            {
                $group: {
                    _id: { $dayOfMonth: '$date' },
                    total: { $sum: 1 },
                    users: { $push: { name: '$name', email: '$email', date: '$date' } }
                }
            },
            {
                $project: {
                    _id: 0,
                    day: '$_id',
                    total: 1,
                    users: 1
                }
            }
        ]);

        const monthlyProductDetails = await Product.aggregate([
            {
                $match: {
                    createdAt: {
                        $gte: new Date(new Date().getFullYear(), 0, 1), 
                        $lt: new Date(new Date().getFullYear() + 1, 0, 1)  
                    }
                }
            },
            {
                $group: {
                    _id: { $month: '$createdAt' },
                    total: { $sum: 1 },
                }
            },
            {
                $project: {
                    _id: 0,
                    month: '$_id',
                    total: 1,
                }
            },
            {
                $sort: {
                    month: 1
                }
            }
        ]);
        
        const currentMonthSales = await Order.aggregate([
            {
              $match: {
                date: {
                  $gte: new Date(currentDate.getFullYear(), currentDate.getMonth(), 1),
                  $lt: new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1)
                }
              }
            },
            {
              $unwind: '$products'
            },
            {
              $match: {
                'products.status': 'Delivered'
              }
            },
            {
              $group: {
                _id: null,
                totalRevenue: { $sum: '$total' }
             
              }
            },
            {
              $project: {
                _id: 0,
                totalRevenue: 1,
                productStatus: 1
              }
            }
          ]);


        const newusers=await User.find({verified:true}).limit(3).sort({date:-1})
        const newprod=await Product.find({status:'Active',is_delete:false}).limit(3).sort({date:-1})
      

      

        res.render('dashboard',{availableproducts,totalproducts,totalRevenue,totalorder,catagery,monthlySales,monthlyUserRegistrations,monthlyProductDetails,currentMonthSales,newusers,newprod})

    } catch (error) {
        console.log(error.message);
    }
}

//load user--------------------------------------

const loaduser=async(req,res)=>{
    try {

        let limit =8
       let totalpage
       let currentPage = parseInt(req.query.page, 10) || 1
       let skip = (currentPage - 1) * limit
       const od = await User.find({verified:true})
       totalpage = Math.ceil(od.length / limit);



        const data=await User.find({verified:true}).limit(limit).skip(skip)
       
        res.render('users',{user:data,currentPage,skip,totalpage})
    } catch (error) {
        console.log(error.message);
    }
}


//load add user-------------------------------------

const loadadduser= async(req,res)=>{

    try {
        res.render('adduser')
    } catch (error) {
        console.log(error.message);
    }
}

//blockuser------------------------------------------
const blockuser=async(req,res)=>{
    try {
        const id= req.query.id
        const user=await User.findOne({_id:id})

        if(user){
        

            await User.updateOne({_id:id},{$set:{status:'Blocked'}})
            if(req.session.userid){
                req.session.userid=null
        
            }
            res.redirect('/admin/users')

        }
        else{
            res.render('users')
            console.log('user not found');
        }
        
        
    } catch (error) {
        console.log(error.message);
        
    }
}

//unblock user===========================================

const unblockuser=async(req,res)=>{

    try {
        const id= req.query.id
        const user=await User.findOne({_id:id})

        if(user){
            await User.findByIdAndUpdate({_id:id},{$set:{status:'Active'}})
            res.redirect('/admin/users')

        }
        else{
            res.render('users')
            console.log('eror coocucrd while unblocking');
        }


        
    } catch (error) {
        console.log(error.message);
    }
}

//load  category--------------------------------------------------------------------

const loadcategory=async(req,res)=>{
    try {


       let limit =6
       let totalpage
       let currentPage = parseInt(req.query.page, 10) || 1
       let skip = (currentPage - 1) * limit
       const ca = await Category.find({ is_delete:false})
       totalpage = Math.ceil(ca.length / limit);


        //delte expired offer
       await Product.updateMany(
        { 'offer.endDate': { $lt: new Date() } },
        { $set: { 'offer': null } }
    );

    await Category.updateMany({
        'offer.endDate':{$lt:new Date()}},
        {$set:{'offer':null}}
    )




       const offer = await Offer.find({
        status: true,
        endDate: { $gt: new Date() } 
    });
       
    

        const category= await Category.find({is_delete:false}).populate('offer').limit(limit).skip(skip)
        res.render('category',{category,currentPage,skip,totalpage,offer})
    } catch (error) {
        console.log(error.message);
    }

}
  
// add category--------------------------------------------------------------------

const addcategory=async(req,res)=>{

    try {

        const iid = req.body.name.trim()
        const check = await Category.find({  Category: { 
            $regex: new RegExp("^" + iid.trim() + "$", "i") 
          }  });

        console.log();
        if(check.length>0){
            console.log('category exist');
            let message='Category already exist'
            const category= await Category.find({})
            res.render('category',{category,message})

        }
        else{
            const category= await new Category({
                Category:iid,
                Status:req.body.status,
                Description:req.body.Description
                })
        
                if(category){
                    console.log("raeched save");
        
                    await category.save()
                    res.redirect('/admin/category')
                }
                else{
                    let message="Category already exist"
                    res.render()
                    console.log("adding failed");
                }

        }
        
        
    } catch (error) {
        console.log(error.message);
        
    }
}


// laoad add catagery================================

const loaddcata=async(req,res)=>{
    try {

        let limit =6
        let totalpage
        let currentPage = parseInt(req.query.page, 10) || 1
        let skip = (currentPage - 1) * limit
        const ca = await Category.find({ is_delete:false})
        totalpage = Math.ceil(ca.length / limit);
        const offer = await Offer.find({
            status: true,
            endDate: { $gt: new Date() } 
        });

        const id=req.query.id

        const cata= await Category.findOne({_id:id})
        
        const category= await Category.find({is_delete:false}).populate('offer').limit(limit).skip(skip)

        res.render('category',{cata,category,currentPage,skip,totalpage,offer})



    } catch (error) {
        console.log(error.message);
    }
}

//update category=======================================


const updatecata=async(req,res)=>{

    try {
        
        const id=req.body.id
        const cata = req.body.category.trim()
        const newid= await Category.find({_id:id})
        
        
        

        const check = await Category.findOne({ 
            Category: { 
              $regex: new RegExp("^" + cata.trim() + "$", "i") 
            } 
          });
          
       
        if(check){
            const newq= check.id
            if(newq!==id){
              
                let message='Category already exist'
                const category= await Category.find({})
                res.render('category',{category,message})


            }
            else{
              
                const edited= await Category.updateOne({_id:id},{$set:{
                    Category:cata,
                    Status:req.body.status,
                    Description:req.body.Description
                }})
                if(edited){
                  
                    res.redirect('/admin/category')
        
                }
                else
                {
                    console.log('eror in eidt');
                }
            }
            
        }

        else{
            console.log(`status is ${req.body.status}`)
            const edited= await Category.updateOne({_id:id},{$set:{
                Category:req.body.category,
                Status:req.body.status,
                Description:req.body.Description
            
            }})
            
            if(edited){
             
                res.redirect('/admin/category')
    
            }
            else{
                console.log('eror in eidt');
            }

        }

        
       
        
    } catch (error) {
        console.log(error.message);
    }

}



//cataegory block----------------------------------------------------------------------------------------


const catablock=async(req,res)=>{

    try {
        const id= req.query.id
        const user=await Category.findOne({_id:id})
        

        if(user){
        

            await Category.updateOne({_id:id},{$set:{Status:'Blocked'}})
            const category= await Category.find({})
            res.render('category',{category})
           

        }
        else{
            const category= await Category.find({})
            res.render('category',{category})
           
        }

        
    } catch (error) {
        console.log(error.message);
    }

}


// category unblock=============================================


const cataunblock=async(req,res)=>{

    try {
        const id= req.query.id
        const user=await Category.findOne({_id:id})
      

        if(user){
        

            await Category.updateOne({_id:id},{$set:{Status:'Active'}})
            const category= await Category.find({})
            res.render('category',{category})
            

        }
        else{
            const category= await Category.find({})
            res.render('category',{category})
            console.log('unblock failed');
        }

        
    } catch (error) {
        console.log(error.message);
    }

}


//cataegory soft delete===========================================

const catadelete= async(req,res)=>{
    try {
    
        const id=req.query.id
        const cata=await Category.updateOne({_id:id},{$set:{is_delete:true}})
        res.redirect('/admin/category')
        //console.log(cata)

     
    } catch (error) {
        console.log(eror.message);
    }
}




//admin logout ============================================

const logout =async(req,res)=>{

    try {
        // console.log(req.session.admintrack);
        req.session.destroy()
        res.redirect('/admin')

        
    } catch (error) {
        console.logerror.message();
        
    }



}



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
            // order.total=order.total-order.products[productIndex].totalprice

            // Save the updated order
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



//couponload----------------------------------------------------------------

const couponload=async(req,res)=>{
    try {

        const coupon=await Coupon.find({isdelete:false})

        res.render('coupon',{coupon})
        
    } catch (error) {
        console.log(error.message)
    }
}


//addcouponlaod----------------------------------------------------------------------------

const addcouponlaod= async(req,res)=>{

    try {

        res.render('addcoupon')
        
    } catch (error) {
        console.log(error.message)
    }

}



//submit coupon-----------------------------------------------------------------------------

const submitaddcoupon = async (req, res) => {
    try {
        const { name, code, couponDate, description,minAmount,offerAmount } = req.body;

        const existingCoupon = await Coupon.findOne({ code });

        if (existingCoupon) {
            return res.json({ success: false, message: 'Coupon with the same code already exists' });
        }

       
        const newcoupon = new Coupon({
            name:name,
            code:code,
            expireDate: couponDate,
            description:description,
            minamount:minAmount,
            offeramount:offerAmount


        });

        const saved = await newcoupon.save();

        if (saved) {
            res.json({ success: true, message: 'Coupon successfully added' });
        
        } else {
            res.json({ success: false, message: 'Failed to add coupon' });
      
        }
    } catch (error) {
        res.json({ success: false, message: 'Failed to add coupon' });
        console.log(error.message);
    }
};


//loadedit-----------------------------------------------------------------


const loadedit=async(req,res)=>{
    try {
        console.log('raeched here')
        const id=req.query.id
        const coupon=await Coupon.findOne({_id:id})
        res.render('editcoupon',{coupon})
    } catch (error) {
        console.log(error.message)
    }
}



//editcoupon======================================================

const editcoupon= async(req,res)=>{
    try {
        const { name, code, couponDate ,minAmount,offerAmount,description }=req.body
        const id = req.query.id
        const coupon= await Coupon.findOne({_id:id})

        const existingCoupon = await Coupon.findOne({ code:code,_id: { $ne: id } });

        if (existingCoupon) {
            
            res.render('editcoupon',{message:'Coupon with the same code already exists',coupon})

        }
        else{

            const updated= await Coupon.updateOne(
                {_id:id},
                {$set:{
                    name:name,
                    code:code,
                    expireDate: couponDate,
                    description:description,
                    minamount:minAmount,
                    offeramount:offerAmount
        
    
                }}
                )
                if(updated){
                    res.redirect('/admin/coupon')
    
                }
                else{
                    res.render('editcoupon',{message:'Failed update ',coupon})
    
                }

        }

        

        
    } catch (error) {
        console.log(error.message)
    }
}



//deletecoupon-------------------------------------------
const deletecoupon = async (req, res) => {
    try {
        const id = req.query.id;


      
        const coupon = await Coupon.findOne({ _id: id });

        if (coupon) {
            
            const deletedCoupon = await Coupon.updateOne({ _id: id },
                {$set:{
                    isdelete:true
                }});

            if (deletedCoupon) {
         
               res.json({ success: true, message: 'Coupon deleted successfully' });
            } else {
                res.json({ success: false, message: 'Failed to delete coupon' });
            }
        } else {
      
                res.json({ success: false, message: 'Failed to delete coupon' });
        }
    } catch (error) {
             res.json({ success: false, message: 'Internal sever error' });
             console.log(error.message);
    }
};



// sales report----------------------------------------------------------------------

const loadsales=async(req,res)=>{

    try {
        const matchcond={}
        const selected=req.query.selected|| 'All'
        const startDate=req.query.startDate
        const endDate=req.query.endDate
        const today = new Date();
        const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
        const endOfMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0, 23, 59, 59);
        const startOfWeek = new Date(today.getFullYear(), today.getMonth(), today.getDate() - today.getDay());
        const endOfWeek = new Date(today.getFullYear(), today.getMonth(), today.getDate() + (6 - today.getDay()), 23, 59, 59);
        const startOfYear = new Date(today.getFullYear(), 0, 1);
        const endOfYear = new Date(today.getFullYear(), 11, 31, 23, 59, 59);
        let  date=null

        if(selected!=='All'){
           
            

            switch (selected) {
                case 'today':
                    case 'today':
                        date = {
                            'date': {
                                $gte: new Date(new Date().setHours(0, 0, 0, 0)),
                                $lt: new Date(new Date().setHours(23, 59, 59, 999))
                            }
                        };
                    
                    break
                case 'thisWeek':
                    date = {
                        'date': {
                            $gte: startOfWeek,
                            $lte: endOfWeek
                        }
                    };
                   
                    break;
                case 'thisMonth':
                    date = {
                        'date': {
                            $gte: startOfMonth,
                            $lte: endOfMonth
                        }
                    };
                    
                    break;
                case 'thisYear':
                    date = {
                        'date': {
                            $gte: startOfYear,
                            $lte: endOfYear
                        }
                    };
                   
                    break;
                default:
                    date = {
                        'date': null
                    };
                    console.log('Default case');
            }
            

        }
  

        if (startDate && endDate) {
            date = {
                'date': {
                    $gte: new Date(startDate),
                    $lte: new Date(endDate)
                }
            };
        
            console.log('Selected date range:', startDate, 'to', endDate);
        }
    
        const sales = await Order.aggregate([
            {
              $lookup: {
                from: 'users',
                localField: 'userid',
                foreignField: '_id',
                as: 'user'
              }
            },
            {
              $unwind: '$products'
            },
            {
              $lookup: {
                from: 'Product',
                localField: 'products.productid',
                foreignField: '_id',
                as: 'product'
              }
            },
            {
              $match: {
                'products.status': 'Delivered',
                ...date
              }
            },
            {
              $project: {
                _id: 1,
                orderid: '$_id',
                username: { $arrayElemAt: ['$user.name', 0] },
                productname: '$products.name',
                price: '$products.price',
                paymentmethod: '$payment',
                status: '$products.status',
                date: '$date'
                
              }
            }
          ]);
          
       
        res.render('salesreport',{sales,selected})
        
    } catch (error) {
        console.log(error.message)
    }
}



//load offer-----------------------------------------------------------------------------------------------

const offerload=async(req,res)=>{
    try {
        const offer= await Offer.find({status:true})
    

        res.render('offer',{offer})

    } catch (error) {
        console.log(error.message)
    }
}


//loadaddoffer-----------------------------------------------------------------------------------------------

const loadaddoffer=async(req,res)=>{
    
    try {
        

        res.render('addoffer')

    } catch (error) {
        console.log(error.message)
    }
}




//offerpost---------------------------------------------------------------------------------------------------------

const offerpost=async(req,res)=>{
    try {
        const formdata=req.body
        const{name,percentage,startDate,endDate}=req.body

        const newoffer= new Offer({
            name,
            percentage,
            startDate,
            endDate
        })

        const savedoffer= newoffer.save()
        if (savedoffer) {
            res.json({ success: true, message: 'Offer successfully added' });
        
        } else {
            res.json({ success: false, message: 'Failed to add offer' });
      
        }
       

    } catch (error) {
        res.json({ success: false, message: 'Internal server error' });
        console.log(error.message)
    }
}


//edit offer load------------------------------------------------------------------


const editofferload=async(req,res)=>{
    try {
        const id=req.query.id
        
        const offer= await Offer.findOne({_id:id})
        
        res.render('editoffer',{offer})

    } catch (error) {
        console.log(error.message)
    }
}


// editoffer -----------------------------------------------------------------
const editoffer = async (req, res) => {
    try {
        const { name, percentage, startDate, endDate } = req.body;
        console.log(name, percentage, startDate, endDate)
        const id = req.query.id;
        const existingOffer = await Offer.findOne({
            name: { $regex: new RegExp(`^${name}$`, 'i') },
            _id: { $ne: id }
        });
        
           
        if (existingOffer) {
    
            res.json({ success: false, message: 'Offer with the same name already exists' });
        }else {
            const offer = await Offer.findByIdAndUpdate(id, {
                name,
                percentage,
                startDate,
                endDate,
            });

            console.log(offer);

            if (offer) {
                res.json({ success: true, message: 'Offer updated successfully' });
            } else {
                const offerDetails = await Offer.findOne({ _id: id });
                res.json({ success: false, message: 'Failed to edit. Please try again.', offer: offerDetails });
            }
        }
    } catch (error) {
        console.log(error.message);
        res.json({ success: false, message: 'An error occurred. Please try again.' });
    }
};


//delete offer-------------------------------------------------------------------------------

const deleteoffer = async (req, res) => {
    try {
        const id = req.query.id;
        console.log(id);
    const result = await Offer.deleteOne({ _id: id });

        if (result.deletedCount > 0) {
            
            res.json({ success: true, message: 'Offer deleted successfully' });
        } else {
            
            res.json({ success: false, message: 'Offer not found or could not be deleted' });
        }
    } catch (error) {
        console.log(error.message);
        res.json({ success: false, message: 'An error occurred. Please try again.' });
    }
};





//applyoffer-------------------------------------------------------------------------------------------

const applyoffer=async(req,res)=>{

    try {
        
        const{offerId,productId }=req.body

        const offer=await Offer.findOne({_id:offerId})

        const product=await Product.findOne({_id:productId})

        const applyoffer=  await Product.updateOne(
            { _id: productId },
            { $set: { offer: offerId } }
          );
        if(applyoffer){

            res.json({success:true,message:'Offer applied succesfully'})
        }
        else{
            res.json({success:false,message:'Failed to apply offer'})

        }

    } catch (error) {
        res.json({success:false,message:'Internal server error'})
        console.log(error.message)
    }
    
}




///removeoffer--------------------------------------------------------

const removeoffer=async(req,res)=>{
    try {
        const pid=req.body.id
        const product=await Product.findOne({_id:pid})
        product.offer=null
        const removeoffer=product.save()
        if(removeoffer){
            res.json({success:true,message:'Removed offer succesfully'})
        }
        else{
            res.json({success:false,message:'Failed to remove offer'})
        }


    } catch (error) {
        res.json({success:false,message:'Internal server error'})
        console.log(error.message)
    }
}





//applyoffercata-----------------------------------------------------------------------

const applyoffercata=async(req,res)=>{
    try {

        const{offerId,cataId }=req.body

        const offer=await Offer.findOne({_id:offerId})

        const catagery=await Category.findOne({_id:cataId})

       const applyoffer=await Category.updateOne({_id:cataId},
        {$set:{offer:offerId}})
        if(applyoffer){
            res.json({success:true,message:'Offer applied successfully'})
        }
        else{
            res.json({success:false,message:"fialed to apply offer"})
        }
        
    } catch (error) {
        res.json({success:false,message:"Internal server error"})
        console.log(error.message)
    }
}


//removecataoffer---------------------------------------------------------------------------------------------



const removecataoffer=async(req,res)=>{
    try {
        const cid= req.body.id
        const category=await Category.findOne({_id:cid})
        category.offer=null
       const removed= category.save()
       if(removed)
        {
            res.json({success:true,message:'Offer removed successfully'})

        }
        else{
            res.json({success:false,message:'Failed to remove offer'})

        }



    } catch (error) {
        res.json({success:false,message:'Internal server error'})
        console.log(error.message)
    }
}











module.exports={
    loadlogin,
    loginverify,
    laoddashbaord,
    loaduser,
    loadadduser,
    blockuser,
    unblockuser,
    loadcategory,
    addcategory,
    loaddcata,
    updatecata,
    catablock,
    cataunblock,
    catadelete,
    logout,
    loadorder,
    orderstatus,
    returnrequest,
    couponload,
    addcouponlaod,
    submitaddcoupon,
    loadedit,
    editcoupon,
    deletecoupon,
    loadsales,
    offerload,
    loadaddoffer,
    offerpost,
    editofferload,
    editoffer,
    deleteoffer,
    applyoffer,
    removeoffer,
    applyoffercata,
    removecataoffer

}