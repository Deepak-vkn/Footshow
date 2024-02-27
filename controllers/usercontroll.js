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
const Coupon=require('../models/coupon')
const Offer=require('../models/offer')
const Banner=require('../models/banner')
const puppeteer = require('puppeteer');
const ejs = require('ejs');

//home-----------------------------------------------------------------------------
const home=async(req,res)=>{
    try{
        let track
        let user
        let cartcount
        let wishcount
        let wishlist
        const home1=await Banner.findOne({name:'Home1'})
        const home2=await Banner.findOne({name:'Home2'})
        const ladies=await Banner.findOne({name:'Ladies'})
        const mens=await Banner.findOne({name:'Mens'})
        const football=await Banner.findOne({name:'Football'})
        const sports=await Banner.findOne({name:'Sports'})

        
        const products = await Product.find({status:'Active',is_delete:false}) .populate({
            path: 'category',
            populate: {
                path: 'offer',
                model: 'Offer',
            },
        })
        .populate('offer').lean().sort({createdAt:-1})
        
        const  product= products.filter(product => {
            return (
                product.category && 
                product.category.Status === 'Active' 
            );
        });
        if(req.session.userid){
            track=true
            const mail=req.session.userid
            user=await User.findOne({email:mail,verified:true})
            const uid=user._id

            const cart=await Cart.findOne({userid:uid})
            
            if(cart){
                 cartcount=cart.products.length
            }
            wishlist=await Wishlist.findOne({userid:uid})
            if(wishlist){
                wishcount=wishlist.products.length
            }
            
            res.render('home',{track,product,user,cartcount,wishcount,home1,home2,ladies,mens,football,sports})
        }
        else{
            track=false
            res.render('home',{track,product,user,home1,home2,ladies,mens,football,sports,wishlist})
        }


    }
    catch(error){
       res.redirect('/500')

    }
    
}
//password hashing---------------------------------------------------------------


const passwordhash=async(password)=>{


    const hashed=await bcrypt.hash(password,10)
    return hashed
}
  
//loadlogin----------------------------------------------------------------------

const loadlogin=async(req,res)=>{

    try {
        const message = req.flash('success');
        res.render('login',{message})
    
      
    } catch (error) {
       res.redirect('/500')

    }
}


//loadregister--------------------------------------------------------------------------

const loadregister=async(req,res)=>{
    try {
        let message
        let code
        code = req.query.referralCode
        res.render('register',{message,code})
    } catch (error) {
       res.redirect('/500');
        
    }
}

//register--------------------------------------------------------------------------------
const register = async (req, res) => {
    try {
        let code
       
        const mail = req.body.email;
        const confirmpass= req.body.password2
        code=req.body.code
        const userExist = await User.findOne({ email: mail,verified:true});
        if (userExist) {
            const verify = userExist.verified;
           
                req.flash('failed','User Already Exist')
                return res.render('register', { message :req.flash('failed')});
        }

         else {

            if(confirmpass!==req.body.password){
                req.flash('pass','Password does not match')
               
                res.render('register', { message :req.flash('pass')});
              

            }
            else{
            
                const hashed = await passwordhash(req.body.password);
                const user = new User({
                    name: req.body.name,
                    email: req.body.email,
                    mobile:req.body.mobile,
                    password: hashed
                });

                const userData = await user.save();
                const id = userData._id;
              
                
                return res.redirect(`/otpgenerte?id=${id}&mail=${mail}&code=${code}`);
            }
            
        }
    } 

    catch (error) {
   
        const message = "An error occurred during registration";
        return res.render('register', { message });
    }
};




// generate otp========================================================

const otpgenerte= async(req,res)=>{
    try {
        const id=req.query.id
        let code
        code=req.query.code
        const mail=req.query.mail
        
        const test=await Otp.find({userid:id})
        if(test){
            
            await Otp.deleteMany({userid:id})
        }
  
            const otp = Math.floor(1000 + Math.random() * 9000); 
            const hashedotp = await bcrypt.hash(String(otp), 10);
           
            const otpsetup=await new Otp({
                userid:id,
                otp:hashedotp,
                createdAt:Date.now(),
                expireAt:Date.now()+90000
    
            })
            const otpsave=await otpsetup.save()
        
    
    
            const transporter=nodemailer.createTransport({
                service:'gmail',
                auth:{
                    user:"deepakvkn1252@gmail.com",
                    pass:'ursi lsmy iwpb sgcs'
                }
            })
          const mailoptions={
                from:"deepakvkn1252@gmail.com",
                to:mail,
                subject:"Footshow verification",
                text:`Welcome to Footshow, your verification otp is ${otp}`
            }
           await transporter.sendMail(mailoptions, (error, info) => {
                if (error) {
                   res.redirect('/500');
                } else {
                    console.log(`Email sent: ${info.response}`);
                }
            });
    
        
            setTimeout(async () => {
                await Otp.deleteMany({ userid: id });
        
            }, 44000);
            return res.redirect(`/otp?id=${id}&mail=${mail}&code=${code}`);
            
        } catch (error) {
           res.redirect('/500');
        }
}







//loadotp-------------------------------------------------------------


const loadotp=async(req,res)=>{
    try {
    const id=req.query.id
    let code
    code=req.query.code

    const mail=req.query.mail
    
        res.render('otp',{id,mail,code})
       
      
    } catch (error) {
       res.redirect('/500');
    }
}




//otp generator----------------------------------------------------------------------------------------------
const ootp=async(req,res)=>{
    try {
       
        
            const randomNumber = Math.floor(1000 + Math.random() * 9000); // Generate a random 4-digit number
    
        
        
    } catch (error) {
       res.redirect('/500');
        
    }
    
    
}


//verify otp------------------------------------------------------------------------

const verifyotp=async(req,res)=>{
    const otp=req.body.otp
    const id=req.body.id
    const mail=req.body.mail
    const data=await Otp.findOne({userid:id})
    let code2
    code2=req.body.code

    
    try {
        if(!data){
    
             await User.deleteMany({_id:id})
             let message='Otp expierd'
              const c=true
              
        
             res.json({success:false,message:'Your otp has been expired'})
        }
        else{
            expire= data.expireAt
            if(expire<Date.now())
            {
               
                await  User.deleteMany({_id:id})
            

                res.json({success:false,message:'Your otp has been expired'})
            }

            else{
                        
                const verify=await Otp.findOne({userid:id})
                const dbotp= await verify.otp;
                const finalcheck= await bcrypt.compare(otp,dbotp)
            

                if(finalcheck){
                await Otp.deleteMany({userid:id})

                //refererl
                const code=generateReferralCode()

                function generateReferralCode() {
                    return Math.random().toString(36).substring(2, 8).toUpperCase();
                  }




              await User.updateOne({_id:id},{ $set: { verified: true ,referral:code} })
                

                if(code2){
                
                    const user= await User.findOne({referral:code2})
                    
                    user.wallet=user.wallet+100

                    user.walletHistory.push({
                        amount:100,
                        direction: 'in', 
                    });

                    await user.save()

                    const newuser= await User.findOne({_id:id,verified: true})
                    newuser.wallet=newuser.wallet+50
                    newuser.walletHistory.push({
                        amount:50,
                        direction: 'in', 
                    });

                    await newuser.save()
                }
                
                res.json({success:true,message:'User succesfully registerd'})
                }
                else{
                
                await User.deleteMany({_id:id})
                
                 
        
    
               res.json({success:false,message:'Otp incorrect'})
                }
    
            }
        }
    
            
        }
      
 
    catch (error) {
        
        
       res.redirect('/500');
        
    }

   
}
//login verify=========================================================================
const verifylogin=async(req,res)=>{

    try {
       const mail=req.body.email
       const password=req.body.password
      

    const userdata=await User.findOne({email:mail,verified:true})

    if(userdata){
        const pass= await userdata.password
  
  
        const passwordcheck=await  bcrypt.compare(password,pass)
        


        if(passwordcheck){

            const verifycheck= await userdata.verified

            if(verifycheck){

            const status= await userdata.status

            if(status==='Active'){
                req.session.userid=userdata.email
            
                const track=req.session.userid
         
                res.redirect('/')


            }
            else{
                req.flash('success','Access Denied')
            
                const message=req.flash('success')
                res.render('login',{message})
                

            }


            }
            else{
                
                req.flash('failed','Incorrect Userid or Password')
               
                const message=req.flash('failed')
                res.render('login',{message})
                
            }
        }
        else{
            
            req.flash('failed','Incorrect Userid or Password')
          
            
            res.render('login', { message: req.flash('failed') });
    
        }


    }
    else{
        let message='invalid username or password'
        res.render('login',{message})
    

    }


    } catch (error) {
       res.redirect('/500');
    }
}

//logout------------------------------------
const logout = async (req, res) => {
    try {
        
         req.session.destroy()

        
        
        res.redirect('/')
        


    } catch (error) {
       res.redirect('/500');
    }
};

//load shop-------------------------------------------------------------------------------------------------


const loadshop = async (req, res) => {
    try {
        let track;
        let user;
        let cartcount
        let wishcount
        let wishlist
        const searchTerm = req.query.search;
        let products;
        let totalproducts
        let totalPages
        let sort=req.query.sort
        let sortOptions
        let currentPage = parseInt(req.query.page, 12) || 1;
        let skip = (currentPage - 1) * 12;
        let filter=req.query.filter
        const filtercata=filter?filter.split(','):[]
        let filterquery={}
        if(filtercata.length>0){
         filterquery={
             'category': { $in: filtercata },
             'status': 'Active',
             is_delete:false
         }
 
        }
        else{
         filterquery = { 'status': 'Active' , is_delete:false};
 
        }
        const shop=await Banner.findOne({name:'Shop'})

   

         //sort----------

         if(sort){
            switch (sort) {
                case 'Latest':
                    sortOptions = { createdAt: -1 };
                    break;
                case 'Oldest':
                    sortOptions = { createdAt: 1 };
                    break;
                case 'Pricelow':
                    sortOptions = { price: 1 };
                    break;
                case 'Pricehigh':
                    sortOptions = { price: -1 };
                    break;
                default:
                    
                    sortOptions = { createdAt: -1 };
                    break;
            }


          }
          else{
             sortOptions = {createdAt: -1 };

          }
       
        if (req.session.userid) {
            track = true;
            const mail = req.session.userid;
            user = await User.findOne({ email: mail,verified:true});
            const uid= user._id

            if (searchTerm) {
                products = await Product.find({
                    $and: [
                        filterquery,
                        { status: 'Active' ,is_delete:false},
                        {
                            $or: [
                                { name: { $regex: searchTerm, $options: 'i' } },
                            ],
                        },
                    ],
                })
                .populate({
                    path: 'category',
                    populate: {
                        path: 'offer',
                        model: 'Offer',
                    },
                })
                .populate('offer')
                    .sort(sortOptions)
                    .skip(skip)
                    .limit(12)
                    .lean();
                  
            } else {
                products = await Product.find(filterquery)
                .populate({
                    path: 'category',
                    populate: {
                        path: 'offer',
                        model: 'Offer',
                    },
                })
                .populate('offer')
                    .sort(sortOptions)
                    .skip(skip)
                    .limit(12)
                    .lean();
            }
           

            const category = await Category.find({'Status':'Active'});
            const product = products.filter((product) => {
                return product.category && product.category.Status === 'Active';
            });
            totalproducts=product.length
            totalPages = Math.ceil(totalproducts / 12);


            const cart=await Cart.findOne({userid:uid})


            if(cart){

             cartcount=cart.products.length
                
            }

             wishlist=await Wishlist.findOne({userid:uid})
            if(wishlist){
                wishcount=wishlist.products.length
            }
           
            
            res.render('shop', { product, category, user, track, totalPages, currentPage,cartcount ,wishcount,shop,wishlist});
        } 
        
        else {
            
            track = false;

            if (searchTerm) {
    
                products = await Product.find({
                    $and: [
                        filterquery,
                        { status: 'Active' },
                        {
                            $or: [
                                { name: { $regex: searchTerm, $options: 'i' } },
                            ],
                        },
                    ],
                })
                .populate({
                    path: 'category',
                    populate: {
                        path: 'offer',
                        model: 'Offer',
                    },
                })
                .populate('offer')
                    .sort(sortOptions)
                    .skip(skip)
                    .limit(12)
                    .lean();
                  
            } else {
                products = await Product.find(filterquery)
                .populate({
                    path: 'category',
                    populate: {
                        path: 'offer',
                        model: 'Offer',
                    },
                })
                .populate('offer')
                    .sort(sortOptions)
                    .skip(skip)
                    .limit(12)
                    .lean();
            }
           
            const product = products.filter((product) => {
                return product.category && product.category.Status === 'Active';
            });
            totalproducts=product.length
            totalPages = Math.ceil(totalproducts / 12);
            const category = await Category.find({'Status':'Active'});
            res.render('shop', { product, category, user, track, totalPages, currentPage,shop });
            
        }
    } catch (error) {
       res.redirect('/500');
    }
};





// load single product ------------------------------------------------------------------------------------------------------

const loadsingleproduct=async(req,res)=>{

    try {
        const id=req.query.id
        if(id){
            const  mail=req.session.userid
            let wishcount
            let cartcount
   
   
            await Product.updateMany(
               { 'offer.endDate': { $lt: new Date() } },
               { $set: { 'offer': null } }
           );
   
           await Category.updateMany({
               'offer.endDate':{$lt:new Date()}},
               {$set:{'offer':null}}
           )

           const product4 = await Product.find({ _id: { $ne: id } })
           .populate({
               path: 'category',
               populate: {
                   path: 'offer',
                   model: 'Offer',
               },
           })
           .populate('offer')
           .limit(4)
           .lean();
       
   
           if(mail){
               const user=await User.findOne({email:mail,verified:true})
               const track=true
               const product = await Product.findOne({_id: id})
               .populate({
                   path: 'category',
                   populate: {
                       path: 'offer',
                       model: 'Offer',
                   },
               })
               .populate('offer')
               .lean();
   
      
               const uid=user._id
               const wishlist =await Wishlist.findOne({'products.productid':id})
   
               const cart=await Cart.findOne({userid:uid})
               if(cart){
                   cartcount=cart.products.length
               }
               const wish=await Wishlist.findOne({userid:uid})
               if(wish){
                   wishcount=wish.products.length
               }
               
               if(wishlist){
                   
                   res.render('singleproduct',{product,user,track,wishlist,cartcount,wishcount,product4})
               }
               else{
   
   
                   res.render('singleproduct',{product,user,track,cartcount,wishcount,cartcount,product4})
               }
   
   
       
           }
           else{ 
           const product = await Product.findOne({_id:id}).populate({
               path: 'category',
               populate: {
                   path: 'offer'
               }
           }).populate('offer').lean();
   
          
           res.render('singleproduct',{product,product4})
   
           }
       
        }
        else{
            res.redirect('/shop')
        }
        
      
        
    } catch (error) {
       res.redirect('/500');
        
    }
}


//Load Men--------------------------------------------------------------------------------------

const loadmen=async(req,res)=>{

    try {
      
          let track
          let user
          let cartcount
          let wishcount
          let totalproducts
          let totalPages
          let sort=req.query.sort
          const searchTerm = req.query.search;
          let products;
          let currentPage = parseInt(req.query.page, 10) || 1;
          const skip=(currentPage-1)*12
          let filter=req.query.filter
          const filtercata=filter?filter.split(','):[]
          let filterquery={}
          let sortOptions
         

          const men=await Banner.findOne({name:'Men'})
          if(filtercata.length>0){
           filterquery={
               'category': { $in: filtercata },
               'status': 'Active',
               'gender':'male',
               is_delete:false
           }
   
          }
          else{
           filterquery = {status:'Active',gender:'male', is_delete:false};
   
          }

          //sort----------

          if(sort){
            switch (sort) {
                case 'Latest':
                    sortOptions = { createdAt: -1 };
                    break;
                case 'Oldest':
                    sortOptions = { createdAt: 1 };
                    break;
                case 'Pricelow':
                    sortOptions = { price: 1 };
                    break;
                case 'Pricehigh':
                    sortOptions = { price: -1 };
                    break;
                default:
                    
                    sortOptions = { createdAt: -1 };
                    break;
            }


          }
          else{
             sortOptions = {createdAt: -1 };

          }
        
        
        
         if(req.session.userid){
            track=true
            const mail=req.session.userid
            user=await User.findOne({email:mail})
           
            if (searchTerm) {
                products = await Product.find({
                    $and: [
                        { status: 'Active' },
                        { gender: 'male' },
                        {
                            $or: [
                                { name: { $regex: searchTerm, $options: 'i' } },
                            ],
                        },
                    ],
                })
                .populate({
                    path: 'category',
                    populate: {
                        path: 'offer',
                        model: 'Offer',
                    },
                })
                .populate('offer')
                    .sort(sortOptions)
                    .skip(skip)
                    .limit(12)
                    .lean();
                  
            } else {
                products =await  Product.find(filterquery) .populate({
                    path: 'category',
                    populate: {
                        path: 'offer',
                        model: 'Offer',
                    },
                })
                .populate('offer')
                .sort(sortOptions)
                .skip(skip)
                .limit(12)
                .lean();
            }
            const category = await Category.find({'Status':'Active'})

            const  product= products.filter(product => {
                return (
                    product.category && 
                    product.category.Status === 'Active' 
                );
            });


            totalproducts=product.length
            totalPages=Math.ceil(totalproducts/12)
            const uid=user._id
            const cart=await Cart.findOne({userid:uid})
            if(cart){
             cartcount=cart.products.length
            }

            const wishlist=await Wishlist.findOne({userid:uid})
            if(wishlist){
                wishcount=wishlist.products.length
            }
            


            res.render('men',{product,category,user,track,currentPage,totalPages,cartcount,wishcount,men})
        }
        else{
            

            track=false
            if (searchTerm) {
                products = await Product.find({
                    $and: [
                        { status: 'Active' },
                        { gender: 'male' },
                        {
                            $or: [
                                { name: { $regex: searchTerm, $options: 'i' } },
                            ],
                        },
                    ],
                })
                .populate({
                    path: 'category',
                    populate: {
                        path: 'offer',
                        model: 'Offer',
                    },
                })
                .populate('offer')
                    .sort(sortOptions)
                    .skip(skip)
                    .limit(12)
                    .lean();
                  
            } else {
                products =await  Product.find(filterquery) .populate({
                    path: 'category',
                    populate: {
                        path: 'offer',
                        model: 'Offer',
                    },
                })
                .populate('offer')
                .sort(sortOptions)
                .skip(skip)
                .limit(12)
                .lean();
            }
            const category = await Category.find({'Status':'Active'})


            const  product= products.filter(product => {
                return (
                    product.category && 
                    product.category.Status === 'Active'
                );
            });
            totalproducts=product.length
            totalPages=Math.ceil(totalproducts/12)
           
            res.render('men',{product,category,user,track,totalPages,currentPage,men})
           
            
        }
        
        
    } catch (error) {
       res.redirect('/500')
    }
}


//Load Women-------------------------------------------------------

const loadwomen=async(req,res)=>{

    try {
        let track
        let user
        let cartcount
        let wishcount
        const searchTerm = req.query.search;
        let products;
        let totalproducts
        let totalPages
        let sort=req.query.sort
        let sortOptions
        let currentPage = parseInt(req.query.page, 10) || 1;
        const skip=(currentPage-1)*12
        const women=await Banner.findOne({name:'Women'})
        let filter=req.query.filter
          const filtercata=filter?filter.split(','):[]
          let filterquery={}


          if(filtercata.length>0){
           filterquery={
               'category': { $in: filtercata },
               'status': 'Active',
               'gender':'female',
               is_delete:false
           }
   
          }
          else{
           filterquery = {status:'Active',gender:'female', is_delete:false};
   
          }

          //sort

            //sort----------

            if(sort){
                switch (sort) {
                    case 'Latest':
                        sortOptions = { createdAt: -1 };
                        break;
                    case 'Oldest':
                        sortOptions = { createdAt: 1 };
                        break;
                    case 'Pricelow':
                        sortOptions = { price: 1 };
                        break;
                    case 'Pricehigh':
                        sortOptions = { price: -1 };
                        break;
                    default:
                        
                        sortOptions = { createdAt: -1 };
                        break;
                }
    
    
              }
              else{
                 sortOptions = {createdAt: -1 };
    
              }
        
        if(req.session.userid){
          track=true
          const mail=req.session.userid
          user=await User.findOne({email:mail})
         
          if (searchTerm) {
            products = await Product.find({
                $and: [
                    { status: 'Active' },
                    { gender: 'female' },
                    {
                        $or: [
                            { name: { $regex: searchTerm, $options: 'i' } },
                        ],
                    },
                ],
            })
            .populate({
                path: 'category',
                populate: {
                    path: 'offer',
                    model: 'Offer',
                },
            })
            .populate('offer')
                .sort(sortOptions)
                .skip(skip)
                .limit(12)
                .lean();
              
        } else {
            products =await  Product.find(filterquery) .populate({
                path: 'category',
                populate: {
                    path: 'offer',
                    model: 'Offer',
                },
            })
            .populate('offer')
            .sort(sortOptions)
            .skip(skip)
            .limit(12)
            .lean();
        }
          const category = await Category.find({'Status':'Active'})
         

          const  product= products.filter(product => {
            return (
                product.category && 
                product.category.Status === 'Active' 
            );
        });
        totalproducts=product.length
        totalPages=Math.ceil(totalproducts/12)
        const uid=user._id
            const cart=await Cart.findOne({userid:uid})
            if(cart){
                cartcount=cart.products.length
            }

            const wishlist=await Wishlist.findOne({userid:uid})
            if(wishlist){
                wishcount=wishlist.products.length
            }
            

           
       
          res.render('women',{product,category,user,track,currentPage,totalPages,cartcount,wishcount,women})
      }
      else{

          track=false
          if (searchTerm) {
            products = await Product.find({
                $and: [
                    { status: 'Active' },
                    { gender: 'female' },
                    {
                        $or: [
                            { name: { $regex: searchTerm, $options: 'i' } },
                        ],
                    },
                ],
            })
            .populate({
                path: 'category',
                populate: {
                    path: 'offer',
                    model: 'Offer',
                },
            })
            .populate('offer')
                .sort(sortOptions)
                .skip(skip)
                .limit(12)
                .lean();
              
        } else {
            products =await  Product.find(filterquery) .populate({
                path: 'category',
                populate: {
                    path: 'offer',
                    model: 'Offer',
                },
            })
            .populate('offer')
            .sort(sortOptions)
            .skip(skip)
            .limit(12)
            .lean();
        }
          const category = await Category.find({'Status':'Active'})

          const  product= products.filter(product => {
            return (
                product.category && 
                product.category.Status === 'Active'
            );
        });
        totalproducts=product.length
        totalPages=Math.ceil(totalproducts/12)
          res.render('women',{product,category,user,track,currentPage,totalPages,women})
         
          
      }
        
        
    } catch (error) {
       res.redirect('/500')
    }
}

//forgetpassword----------------------------------

const forgetpassword =async(req,res)=>{
    try {
        res.render('forgetpassword')
    } 
    catch (error) {
       res.redirect('/500');
    }
}

//MAIL SEND----------------------------

const forgetpasswordmailsend=async(req,res)=>{
    try {
         const mail=req.body.email
         const user=await User.findOne({email:mail})

         if(!user){
            
            return res.status(403).json({ message: ' User not found' });
         }
         else{
            const check=await user.verified
           
            if(check!==true){
                
                return res.status(403).json({ message: 'User not verified' });
            }
            else{
                const id=user._id
        
                const resetPasswordLink = `http://footshow.shop/resetpassword?id=${id}`;
                const transporter=nodemailer.createTransport({
                    service:'gmail',
                    auth:{
                        user:"deepakvkn1252@gmail.com",
                        pass:'ursi lsmy iwpb sgcs'
                    }
                })
              const mailoptions={
                    from:"deepakvkn1252@gmail.com",
                    to:mail,
                    subject:"Password Reset",
                    text:`Click on the link to reset your password ${resetPasswordLink}`
                }
               await transporter.sendMail(mailoptions, (error, info) => {
                    if (error) {
                       res.redirect('/500');
                        return res.status(500).json({ message: 'Email sent failed' });
                    } else {
                        return res.status(200).json({ message: 'Email sent successfully' });
                        
                    }
                });
        


            }

            }



    } catch (error) {
       res.redirect('/500');
    }
}


//reset password laod-------------------------------------

const resetpasswordload=async(req,res)=>{
    try {
        const id=req.query.id
    
        res.render('resetpassword',{id})
        
    } catch (error) {
       res.redirect('/500')
    }
}

//reset password---------------------------------
const resetpassword = async (req, res) => {
    try {
        const id = req.query.id;
        
        const pass1 = req.body.password1;
        const hashedPassword = await passwordhash(pass1);
        const user = await User.findOne({ _id: id });
 


            if (user) {
                const update = await User.updateOne({ _id: id }, { $set: { password: hashedPassword } });
               
                if (update.modifiedCount > 0) {
                    
                    return res.status(200).json({ message: 'Password changed successfully' });
                    req.session.reset=null
                } else {
                    
                    return res.status(400).json({ message: 'Password not changed. Please try again.' });
                }
            } else {
        
                return res.status(404).json({ message: 'User not found' });
            }

        
        
        
    } catch (error) {
       res.redirect('/500');
        return res.status(500).json({ message: 'Internal Server Error' });
    }
};


//Profile load ---------------------------------------------------------------------

const profileload =async(req,res)=>{
    try {
        const id=req.session.userid
        if(id){
            const user=await User.findOne({email:id,verified:true})
            const uid=user._id
            const delted=await Order.deleteMany({payementstatus:'Pending'})
            let totalproducts; 
            let totalPages;
            let limit=6
            let currentPage = parseInt(req.query.page, 10) || 1; 
            let skip = (currentPage - 1) * limit;
            const order1=await Order.find({userid:uid,  'products.status': { $ne: 'Pending' }})
            const length = order1.length; 
        
            totalproducts = length; 
            totalPages = Math.ceil(totalproducts / limit);

           
            const track=true
            let cartcount
            let wishcount
            let coupon
            const order=await Order.find({userid:uid,  'products.status': { $ne: 'Pending' }}).skip(skip).limit(limit)
            
          
            const cart=await Cart.findOne({userid:uid})
            coupon= await Coupon.find({isdelete:false})

       
            
            


            if(cart){
             cartcount=cart.products.length
            }

            const wishlist=await Wishlist.findOne({userid:uid})
            if(wishlist){
                wishcount=wishlist.products.length
            }
            
                if(order){
                    res.render('profile',{user,order,track,cartcount,wishcount,coupon,totalPages,currentPage,skip})
                    
                }
                else{
                    res.render('profile',{user,track,cartcount,wishcount,coupon})
                }

        }
        else{
            res.redirect('/login')
        }
       
        
        
    } catch (error) {
       res.redirect('/500');
    }
}



//profile edit------------------------------------------------------------------------------------

const profileedit=async(req,res)=>{
    try {
         

        const{name}=req.body
        const id=req.query.id
        const user=await User.findOne({_id:id})
        if (!name) {
            return res.status(400).json({ message: ' name must be provided for update' });
        }

        if(user){
           const edited= await User.updateOne({_id:id},{$set:{
                name:name|| user.name
                
           }})
           if(edited.modifiedCount>0){
            const us=await User.findOne({_id:id})
            return res.status(200).json({message:"user updated",us})
           }

           else{
            return res.status(400).json({ message: 'No changes made to the user profile' });
           }
        }
        
        else{
           return res.status(404).json({ message: 'User not found' });
        }
        
    } catch (error) {
       res.redirect('/500');
        return res.status(500).json({ message: 'Internal Server Error' });
    }
}


//updatepassword------------------------------------------------


const updatepassword=async(req,res)=>{
    try {
        const uid=req.query.id
       
        const {currentPassword,newPassword}=req.body

        const user= await User.findOne({_id:uid})

        if(!user){
        

            res.json({message:'User not found'})
        }
        else{

            const pass=user.password
            
          
            const passwordMatch = await bcrypt.compare(currentPassword, pass);
            
            if(passwordMatch){
            
                const hashedNewPassword = await bcrypt.hash(newPassword, 10);
                user.password=hashedNewPassword
                user.save()
                res.json({message:'Password Updated '})
            }
            else{
                
                res.json({message:'Enterd wrong password'})
            }

        }
        
        

    } catch (error) {
        res.json({message:'Failed to update password'})
       res.redirect('/500')
    }
}

//cearte adress------------------------------------------------------------------

const loadcreateaddress=async(req,res)=>{

    try {
        res.render('createaddaddress')
        
    } catch (error) {
       res.redirect('/500')
    }
}



// create address---------------------------------------------------------

const createaddress =async(req,res)=>{

    try {
        const { name, building, mobile, street, city, state, pincode } = req.body;
        const mail=req.session.userid
        const user=await User.findOne({email:mail,verified:true})

        if(user){
              
            if(user.address.length>0){

               user.address.push({
                    name: name,
                    buildingname:building,
                    mobile: mobile,
                    street: street,
                    city: city,
                    state: state,
                    pincode: pincode
                });
                     
                 const updatedUser = await user.save();
                 if(updatedUser){
                    const id=user._id.toString()
                    

                    res.redirect(`/profile?id=${mail}`)
                 }
                 else{
                    
                    res.json({ success: false, message: 'Failed to add address' });
                 }
          
            }
            else{
                user.address = [{
                    name: name,
                    buildingname:building,
                    mobile: mobile,
                    street: street,
                    city: city,
                    state: state,
                    pincode: pincode
                }];
            
                const updatedUser = await user.save();
            
                if (updatedUser) {
                    const id=user._id
           
                    res.redirect(`/profile?id=${mail}`)
                    
                } else {
                    res.json({ success: false, message: 'Failed to add address' });
                }
               
        
            }


        }
        else{
        
            res.json({ success: false, message: 'User not found' });
        }
        
        
        


    } catch (error) {
       res.redirect('/500')
    }
}


//edit address---------------------------------------------------


const editaddress= async(req,res)=>{
    try {
        const ind=req.query.index
        const id=req.query.id
       
        const user= await User.findOne({_id:id,verified:true})
       
        const adress=user.address[ind]
        
        res.render('adressedit',{adress,user})


    } catch (error) {
       res.redirect('/500')
    }
}


// edit adress post mesthod-------------------------------------------------------------

const editaddresspost=async(req,res)=>{
    try {
        const id=req.body.address_id
        const uid=req.body.user_id
        const { edit_name, edit_building, edit_mobile, edit_street, edit_city, edit_state, edit_pincode } = req.body;
        const user=await User.findOne({_id:uid,'address._id':id})
        
        const updatedUser = await User.findOneAndUpdate(
            { _id: uid, 'address._id': id },
            {
                $set: {
                    'address.$.name': edit_name,
                    'address.$.buildingname': edit_building,
                    'address.$.mobile': edit_mobile,
                    'address.$.street': edit_street,
                    'address.$.city': edit_city,
                    'address.$.state': edit_state,
                    'address.$.pincode': edit_pincode
                },
            },
            { new: true }
        );
        if(updatedUser){
            const mail=user.email
           
            res.redirect(`/profile?id=${mail}`)
        }
        else{
            return res.status(404).send('Address not found');
        }
        
    } catch (error) {
       res.redirect('/500')
    }
}

// add address-------------------------------------------------


const addaddress=async(req,res)=>{

    try {
        res.render('addaddress')
        
    } catch (error) {
       res.redirect('/500')
    }
}


//add adrss post----------------------------------------


const addaddresspost=async(req,res)=>{

    try {
        const { name, building, mobile, street, city, state, pincode } = req.body;
        const mail=req.session.userid
        const user=await User.findOne({email:mail,verified:true})

        if(user){
              
            if(user.address.length>0){

               user.address.push({
                    name: name,
                    buildingname:building,
                    mobile: mobile,
                    street: street,
                    city: city,
                    state: state,
                    pincode: pincode
                });
                     
                 const updatedUser = await user.save();
                 if(updatedUser){
                    const id=user._id.toString()
                    
                    
                    res.redirect(`/checkout?uid=${64378}`)
                 }
                 else{
                
                    res.redirect(`/checkout?uid=${64378}`)
                 }
          
            }
            else{
                user.address = [{
                    name: name,
                    buildingname:building,
                    mobile: mobile,
                    street: street,
                    city: city,
                    state: state,
                    pincode: pincode
                }];
            
                const updatedUser = await user.save();
            
                if (updatedUser) {
                    const id=user._id
                  
                    res.redirect(`/checkout?uid=${64378}`)
                    
                } else {
                    res.redirect(`/checkout?uid=${64378}`)
                }
               
            
            }
        }
        else{
            res.json({ success: false, message: 'User not found' });
        }
        
        
        


    } catch (error) {
       res.redirect('/500')
    }
}
//cancel order------------------------------------------------------



const cancelorder = async (req, res) => {
    try {
        const index = req.query.index;
        const oid = req.query.oid;

        const order = await Order.findOne({ _id: oid });
        const prod = order.products[index];
        const pid = prod.productid;

        if (prod) {
            
            const producttotal = prod.totalprice;
            let pquantity = prod.quantity;

            const ordertotal = order.total;

            
        
            if (order.payment !== 'Cash on Delivery') {
                const user = await User.findOne({ _id: order.userid });

                if (user) {
                    const refundAmount = producttotal
                    user.wallet += refundAmount;
                    await user.save();

                    user.walletHistory.push({
                        amount:total,
                        direction: 'in', 
                    });

                }
            }



            const result = await Order.updateOne(
                { _id: oid },
                {
                    $pull: {
                        products: { productid: pid },
                    },
                    $inc: {
                        total: -producttotal,
                    },
                }
            );

            if (result) {
                const updatequantity = await Product.findOne({ _id: pid });
                const updateProductResult = await Product.updateOne(
                    { _id: pid },
                    {
                        $inc: {
                            quantity: pquantity,
                        },
                    }
                );

                if (updateProductResult) {
                    const updatedOrder = await Order.findOne({ _id: oid });
                    if (!updatedOrder.products || updatedOrder.products.length === 0) {
                    
                        const a=await Order.deleteOne({ _id: oid });
                    

                        res.redirect('/profile');
                    } else {
                        res.redirect('/profile');
                    }
                } else {
            
                    
                    res.json({
                        success: false,
                        message: 'Failed to update product',
                    });
                }
            } else {
                
                
                res.json({
                    success: false,
                    message: 'Failed to update order',
                });
            }
        } else {
            
    
            res.json({
                success: false,
                message: 'Product not found in order',
            });
        }
    } catch (error) {
       res.redirect('/500');
      
    }
};

// returnproduct -----------------------------------------


const returnproduct= async(req,res)=>{
    try {
        const{reason,index,orderId}=req.body
        const order=await Order.findOne({_id:orderId})
        
        order.products[index].status='Return Request'
        order.products[index].return=reason
        const updated= await order.save()

        if(updated){
            res.json({success:true})
           
        }
        else{
            res.json({success:false})
        
        }
    } catch (error) {
        res.redirect('/500')
    
    }
}



//deleteaddress---------------------------------------------------------------------


const deleteaddress= async(req,res)=>{
try {
    
    const ind=req.query.index
    const id=req.query.id
   
    const user= await User.findOne({_id:id,verified:true})
   
    const adress=user.address[ind]
    const deleted = await User.findOneAndUpdate(
        { _id: id, verified: true },
        { $pull: { address: { _id: user.address[ind]._id } } },
        { new: true }
    );
    
    res.redirect('/profile')


} catch (error) {
   res.redirect('/500')
}


}


//wallethistory----------------------------------------------------

const wallethistory=async(req,res)=>{
    try {

        const mail= req.session.userid

        let totalproducts; 
        let totalPages;
        let limit=5
       
        let currentPage = parseInt(req.query.page, 10) || 1; 
        const wallet1 = await User.findOne({ email: mail, verified: true });
        const length = wallet1.walletHistory.length; 
        let skip = (currentPage - 1) * 5;
        totalproducts = length; 
        totalPages = Math.ceil(totalproducts / limit);
        
        if (mail) {
            const user = await User.findOne({ email: mail, verified: true })
                .select('walletHistory')
               .skip(skip)
                .limit(limit);
        
            const walletHistory = user ? user.walletHistory : [];
            totalproducts = user.walletHistory.length;
            totalPages = Math.ceil(totalproducts / limit);
        
            res.render('wallethistory', { walletHistory, totalPages, currentPage ,skip});
        } else {
            res.render('wallethistory', { walletHistory: [], totalPages: 0, currentPage ,skip});
        }
        
        
        
    } catch (error) {
       res.redirect('/500')
    }
}


//createinvoice-------------------------------------------------------------



const createinvoice=async(req,res)=>{

    try {
     
        const oid=req.query.id
        const order= await Order.findOne({_id:oid})
        if(order.payementstatus==='Cash on delivery'){
            order.products = order.products.filter(product => product.status === 'Delivered');
        }
        
        const html = await ejs.renderFile('views/user/invoice.ejs', {order});

        
        const browser = await puppeteer.launch();
        const page = await browser.newPage();
        await page.setContent(html);


        const pdfBuffer = await page.pdf({ format: 'A4' });
        await browser.close();

        
        res.contentType('application/pdf');
        res.send(pdfBuffer);


        
    } catch (error) {

       res.redirect('/500')
    }


}


//vieworder--------------------------------------------------


const vieworder=async(req,res)=>{
    try {
        
        const {id,i}=req.query
        const order=await Order.findOne({_id:id})
        const product=order.products[i]
        if(product){
            res.render('vieworder',{product,order})
            
        }
        else{
            res.redirect('/profile')
        }
    } catch (error) {
        res.json({success:false})
       res.redirect('/500')
    }
}


//about---------------------------------------------------------------------------------


const about=async(req,res)=>{
    try {
        let track
        let user

        if(req.session.userid){
            track=true
            const mail=req.session.userid
            user=await User.findOne({email:mail,verified:true})
            const uid=user._id
            res.render('about',{track,user})
        }
        else{
            res.render('about',{track,user})
        }
       
    } catch (error) {
       res.redirect('/500')
    }
}



//load404-------------------------------------------------------------------------------

const load404=async(req,res)=>{
    try {
        res.render('404')
    } catch (error) {
       res.redirect('/500')
    }
}



//load internal servr error-----------------------------------------------------


const load500=async(req,res)=>{
    try {


        res.render('500')
        
    } catch (error) {
       res.redirect('/500')
    }
}





module.exports={
    home,
    loadlogin,
    loadregister,
    register,
    otpgenerte,
    loadotp,
    verifyotp,
    verifylogin,
    logout,
    loadshop,
    loadsingleproduct,
    loadmen,
    loadwomen,
    forgetpassword,
    forgetpasswordmailsend,
    resetpasswordload,
    resetpassword,
    profileload,
    profileedit,
    updatepassword,
    loadcreateaddress,
    createaddress,
    editaddress,
    editaddresspost,
    addaddress,
    addaddresspost,
    cancelorder,
    returnproduct,
    deleteaddress,
    wallethistory,
    createinvoice,
    vieworder,
    about,
    load404,
    load500

}