

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

//load login------------------------------------------

const loadlogin=async(req,res)=>{

    try {
        res.render('login')
    } catch (error) {
        res.redirect('/admin/500');
        
    }
}

//password hashing---------------------------------------------------


const passwordhash=async(password)=>{


    const hashed=await bcrypt.hash(password,10)
    return hashed
}

//login verify---------------------------------------

const loginverify=async(req,res)=>{
    try {
        
        const mail=req.body.email
        const password=req.body.password
        const admin=await Admin.findOne({name:mail})

        if(admin){

            const adminpass=admin.password

            const passwordcomapre=await bcrypt.compare(password,adminpass)

            if(passwordcomapre){

                req.session.admintrack=mail
        
                
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
        res.redirect('/admin/500');
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
       
        const year = new Date().getFullYear(); 

        const monthlySales = await Order.aggregate([
          {
            $match: {
              date: {
                $gte: new Date(year, 0, 1), 
                $lt: new Date(year + 1, 0, 1) 
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
        res.redirect('/admin/500');
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
        res.redirect('/admin/500');
    }
}


//load add user-------------------------------------

const loadadduser= async(req,res)=>{

    try {
        res.render('adduser')
    } catch (error) {
        res.redirect('/admin/500');
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
        res.redirect('/admin/500');
        
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
            
        }


        
    } catch (error) {
        res.redirect('/admin/500');
    }
}




//admin logout ============================================

const logout =async(req,res)=>{

    try {
        // console.log(req.session.admintrack);
        req.session.destroy()
        res.redirect('/admin')

        
    } catch (error) {
        res.redirect('/admin/500')
        
    }



}

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
                
            }
            

        }
  

        if (startDate && endDate) {
            date = {
                'date': {
                    $gte: new Date(startDate),
                    $lte: new Date(endDate)
                }
            };
        
    
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
        res.redirect('/admin/500')
    }
}



//loadbanner--------------------------------------------------------------------------------------

const loadbanner=async(req,res)=>{
    try {

        let limit =5
        let totalpage
        let currentPage = parseInt(req.query.page, 10) || 1
        let skip = (currentPage - 1) * limit
        const banner1=await Banner.find({isdelete:true})
        totalpage = Math.ceil(banner1.length / limit);
        
        const banner=await Banner.find({isdelete:true}).skip(skip).limit(limit)
        res.render('bannerlist',{banner,totalpage,currentPage,skip})
    } catch (error) {
        res.redirect('/admin/500')
    }
}



//loadaddbanner------------------------------------------------------------------------------------

const loadaddbanner=async(req,res)=>{
    try {
        
        res.render('addbanner')
    } catch (error) {
        res.redirect('/admin/500')
    }
}




//addbanner--------------------------------------------------------------------------------------


const addbanner=async(req,res)=>{
    try {
        const {name,description}=req.body

        const iid = name.trim()
        const check = await Offer.find({  name: { 
            $regex: new RegExp("^" + iid.trim() + "$", "i") 
          }  });


        if (check) {
            return res.json({ success: false, message: 'Banner with the same code already exists' });
        }

        const newbanner= new Banner({
            name:name,
            description:description,
            image:req.file ? req.file.filename  : null
        })
            await newbanner.save()
        if(newbanner){
            

            res.json({success:true,message:'Banner added successfully'})
        }
        else{
            res.json({success:false,message:'Failed to add banner'})
    
        }
    } catch (error) {
        
     
        res.redirect('/admin/500')
    }
}




//loadeditbanner----------------------------------------------------------------------

const loadeditbanner=async(req,res)=>{
    try {
    
        const id=req.query.id
        const banner=await Banner.findOne({_id:id})
  
        res.render('editbanner',{banner})


    } catch (error) {
        res.redirect('/admin/500')
    }
}


//editbanner---------------------------------------------------------------------------

const editbanner=async(req,res)=>{
    try {

        const {name,description}=req.body
        const id=req.query.id
        const banner2=await Banner.findOne({_id:id})
        const image = req.file ? req.file.filename : banner2.image;

const banner = await Banner.updateOne({ _id: id }, {
    $set: {
        name,
        description,
        image
    }
});

        if(banner){
        
            res.redirect('/admin/banner')
        }
        else{
        
            res.render('editbanner',{message:'failed to update banner'})
        }

        
    } catch (error) {
        res.redirect('/admin/500')
    }
}




//deletebanner--------------------------------------------------------------------------


const deletebanner=async(req,res)=>{
    try {
        const id=req.query.id
        const banner=await Banner.deleteOne({_id:id})

        if(banner.deletedCount > 0){
            res.json({success:true})
        }
        else{
            res.json({success:false})
        }
    } catch (error) {
       
        res.redirect('/admin/500')
    }
}


//internal servr error---------------------------------------------------------------


const load500=async(req,res)=>{
    try {
        res.render('500')
    } catch (error) {
        res.redirect('/admin/500')
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
    logout,
    loadsales,
    loadbanner,
    loadaddbanner,
    addbanner,
    loadeditbanner,
    editbanner,
    deletebanner,
    load500


}