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



//home-----------------------------------------------------------------------------
const home=async(req,res)=>{
    try{
        let track
        let user
        const products = await Product.find({status:'Active'}).populate('category').lean();
        
        const  product= products.filter(product => {
            return (
                product.category && 
                product.category.Status === 'Active' 
            );
        });
        if(req.session.userid){
            track=true
            const mail=req.session.userid
            user=await User.findOne({email:mail})
           
            res.render('home',{track,product,user})
        }
        else{
            track=false
            res.render('home',{track,product,user})
        }
       


    }
    catch(error){
        console.log(error.message)

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
        console.log(`conslefalsh is ${message}`)
      
    } catch (error) {
        console.log(error.message)

    }
}


//loadregister--------------------------------------------------------------------------

const loadregister=async(req,res)=>{
    try {
        let message
        res.render('register',{message})
    } catch (error) {
        console.log(error.message);
        
    }
}

//register--------------------------------------------------------------------------------
const register = async (req, res) => {
    try {
        const mail = req.body.email;
        const confirmpass= req.body.password2
        console.log(req.body.password)
        const userExist = await User.findOne({ email: mail });
        // console.log(`user ${userExist}`)

        if (userExist) {
            const verify = userExist.verified;
           //console.log(`verify ${verify}`)

            if (verify === true) {
               // const message = "User exists";
                req.flash('failed','User Already Exist')
                return res.render('register', { message :req.flash('failed')});
            } 
            else {

                if(confirmpass!==req.body.password){
                    req.flash('pass','Password does not match')
                   
                    res.render('register', { message :req.flash('pass')});
                  
                }
                else{
                    // Common code for user registration
                    const hashed = await passwordhash(req.body.password);
                    const user = new User({
                        name: req.body.name,
                        email: req.body.email,
                        password: hashed
                    });
    
                    const userData = await user.save();
                    const id = userData._id;
                  
                    // Redirect to OTP page
                    //return res.redirect(`/otp?id=${id}&mail=${mail}`);
                    return res.redirect(`/otpgenerte?id=${id}&mail=${mail}`);
                    
                }
            }
        }

         else {

            if(confirmpass!==req.body.password){
                req.flash('pass','Password does not match')
               
                res.render('register', { message :req.flash('pass')});
              

            }
            else{
                // Common code for user registration
                const hashed = await passwordhash(req.body.password);
                const user = new User({
                    name: req.body.name,
                    email: req.body.email,
                    mobile:req.body.mobile,
                    password: hashed
                });

                const userData = await user.save();
                const id = userData._id;
              
                // Redirect to OTP page
                return res.redirect(`/otpgenerte?id=${id}&mail=${mail}`);
            }
            
        }
    } 

    catch (error) {
        console.log(error.message);
        
        const message = "An error occurred during registration";
        return res.render('register', { message });
    }
};




// generate otp========================================================

const otpgenerte= async(req,res)=>{
    try {
        const id=req.query.id
    
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
                expireAt:Date.now()+66000
    
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
                    console.log(error.message);
                } else {
                    console.log(`Email sent: ${info.response}`);
                }
            });
    
        
            setTimeout(async () => {
                await Otp.deleteMany({ userid: id });
                console.log('OTP deleted after timeout');
            }, 44000);
            return res.redirect(`/otp?id=${id}&mail=${mail}`);
            
        } catch (error) {
            console.log(error.message);
        }
}







//loadotp-------------------------------------------------------------


const loadotp=async(req,res)=>{
    try {
    const id=req.query.id

    const mail=req.query.mail
    
        res.render('otp',{id,mail})
       
      
    } catch (error) {
        console.log(error.message);
    }
}




//otp generator----------------------------------------------------------------------------------------------
const ootp=async(req,res)=>{
    try {
       
        
            const randomNumber = Math.floor(1000 + Math.random() * 9000); // Generate a random 4-digit number
    
        
        
    } catch (error) {
        console.log(error.message);
        
    }
    
    
}


//verify otp------------------------------------------------------------------------

const verifyotp=async(req,res)=>{
    const otp=req.body.otp
    const id=req.body.id
    const mail=req.body.mail
    const data=await Otp.findOne({userid:id})

    
    try {
        if(!data){
             // await Otp.deleteMany({userid:id})
             await User.deleteMany({_id:id})
             let message='Otp expierd'
              const c=true
              console.log("expierd");
             //res.render('otp',{message,c,id,mail})
             res.json({success:false,message:'Your otp has been expired'})
        }
        else{
            expire= data.expireAt
            if(expire<Date.now())
            {
               // await Otp.deleteMany({userid:id})
                await  User.deleteMany({_id:id})
                console.log("expierd");
                //res.render('otp',{message,id,mail})
                res.json({success:false,message:'Your otp has been expired'})
            }

            else{
                        
                const verify=await Otp.findOne({userid:id})
                const dbotp=await verify.otp;
                const finalcheck= await bcrypt.compare(otp,dbotp)
            

                if(finalcheck){
                await Otp.deleteMany({userid:id})
                await User.updateOne({_id:id},{ $set: { verified: true } })
                console.log("user regster success");
                //res.render('login',{message})
                res.json({success:true,message:'User succesfully registerd'})
                }
                else{
                // await Otp.deleteMany({userid:id})
                await User.deleteMany({_id:id})
                
                 
                console.log("invalid creadentials");
               // res.render('otp',{message,id,mail})
               res.json({success:false,message:'Otp incorrect'})
                }
    
            }
        }
    
            
        }
      
 
    catch (error) {
        console.log('raecher catch')
        res.json({success:false,message:"Internal server error"})
        console.log(error.message);
        
    }

   
}
//login verify=========================================================================
const verifylogin=async(req,res)=>{

    try {
       const mail=req.body.email
       const password=req.body.password
      

    const userdata=await User.findOne({email:mail})

    if(userdata){
        const pass= await userdata.password
  
  
        const passwordcheck=await  bcrypt.compare(password,pass)
        


        if(passwordcheck){

            const verifycheck= await userdata.verified

            if(verifycheck){

            const status= await userdata.status

            if(status==='Active'){
                req.session.userid=userdata.email
                //console.log(req.session.userdata);
                const track=req.session.userid
         
                res.redirect('/')


            }
            else{
                req.flash('success','Access Denied')
                //let message='Access Denied'
                const message=req.flash('success')
                res.render('login',{message})
                console.log('login failed1');

            }


            }
            else{
                
                req.flash('failed','Incorrect Userid or Password')
               
                const message=req.flash('failed')
                res.render('login',{message})
                console.log('login failed1');
            }
        }
        else{
            
            req.flash('failed','Incorrect Userid or Password')
          
            
            res.render('login', { message: req.flash('failed') });
            console.log('login failed2');
        }


    }
    else{
        let message='invalid username or password'
        res.render('login',{message})
        console.log('login failed3');

    }


    } catch (error) {
        console.log(error.message);
    }
}

//logout------------------------------------
const logout = async (req, res) => {
    try {
        
         req.session.destroy()
        //console.log("destroy");
        
        
        res.redirect('/')
        


    } catch (error) {
        console.log(error.message);
    }
};

//load shop-------------------------------------------------------------------------------------------
const loadshop = async (req, res) => {
    try {
        let track;
        let user;
        const searchTerm = req.query.search;
        let products;
        let totalproducts = await Product.find({ status: 'Active' }).count();
        let totalPages = Math.ceil(totalproducts / 10);
        let currentPage = parseInt(req.query.page, 12) || 1;
        const skip = (currentPage - 1) * 12;

        if (req.session.userid) {
            track = true;
            const mail = req.session.userid;
            user = await User.findOne({ email: mail });

            if (searchTerm) {
                products = await Product.find({
                    $and: [
                        { status: 'Active' },
                        {
                            $or: [
                                { name: { $regex: searchTerm, $options: 'i' } },
                            ],
                        },
                    ],
                })
                    .populate('category')
                    .skip(skip)
                    .limit(12)
                    .lean();
                  
            } else {
                products = await Product.find({ status: 'Active' })
                    .populate('category')
                    .skip(skip)
                    .limit(12)
                    .lean();
            }
           

            const category = await Category.find({});
            const product = products.filter((product) => {
                return product.category && product.category.Status === 'Active';
            });

            res.render('shop', { product, category, user, track, totalPages, currentPage });
        } else {
            
            track = false;

            if (searchTerm) {
                // If there's a search term, perform a search query
                products = await Product.find({
                    $and: [
                        { status: 'Active' },
                        {
                            $or: [
                                { name: { $regex: searchTerm, $options: 'i' } },
                            ],
                        },
                    ],
                })
                    .populate('category')
                    .skip(skip)
                    .limit(12)
                    .lean();
                  
            } else {
                products = await Product.find({ status: 'Active' })
                    .populate('category')
                    .skip(skip)
                    .limit(12)
                    .lean();
            }
           
            const product = products.filter((product) => {
                return product.category && product.category.Status === 'Active';
            });
            console.log(product);
            const category = await Category.find({});
            res.render('shop', { product, category, user, track, totalPages, currentPage });
            
        }
    } catch (error) {
        console.log(error.message);
    }
};


// load single product --------------------------------------------------------------------------------

const loadsingleproduct=async(req,res)=>{

    try {
        const id=req.query.id
          mail=req.session.userid
        if(mail){
            const user=await User.findOne({email:mail,verified:true})
            const track=true
            const product = await Product.findOne({_id:id}).populate('category').lean();

            const wishlist =await Wishlist.findOne({'products.productid':id})
            if(wishlist){
                res.render('singleproduct',{product,user,track,wishlist})
console.log(wishlist)
            }
            else{
                res.render('singleproduct',{product,user,track})
            }

        
          
    
        }
        else{ 
        const product = await Product.findOne({_id:id}).populate('category').lean();

        
        res.render('singleproduct',{product})

        }
        //console.log(`id product is ${id} `);
      
        
    } catch (error) {
        console.log(error.message);
        
    }
}


//Load Men--------------------------------------------------------------------------------------

const loadmen=async(req,res)=>{

    try {
      
          let track
          let user
          const searchTerm = req.query.search;
          let products;
          let totalproducts=await Product.find({status:'Active',gender:'male'}).count()
          let totalPages=Math.ceil(totalproducts/12)
          let currentPage = parseInt(req.query.page, 10) || 1;
          const skip=(currentPage-1)*12
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
                    .populate('category')
                    .skip(skip)
                    .limit(12)
                    .lean();
                  
            } else {
                products =await  Product.find({status:'Active',gender:'male'}).populate('category')
                .skip(skip)
                .limit(12)
                .lean();
            }
            const category = await Category.find({})

            const  product= products.filter(product => {
                return (
                    product.category && 
                    product.category.Status === 'Active' 
                );
            });
         
            res.render('men',{product,category,user,track,currentPage,totalPages})
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
                    .populate('category')
                    .skip(skip)
                    .limit(12)
                    .lean();
                  
            } else {
                products =await  Product.find({status:'Active',gender:'male'}).populate('category')
                .skip(skip)
                .limit(12)
                .lean();
            }
            const category = await Category.find({})


            const  product= products.filter(product => {
                return (
                    product.category && // Ensure category is populated
                    product.category.Status === 'Active' // Filter based on category status
                );
            });
           
            res.render('men',{product,category,user,track,totalPages,currentPage})
           
            
        }
        
        
    } catch (error) {
        console.log(error.message)
    }
}


//Load Women-------------------------------------------------------

const loadwomen=async(req,res)=>{

    try {
        let track
        let user
        const searchTerm = req.query.search;
        let products;
        let totalproducts=await Product.find({status:'Active',gender:'female'}).count()
        let totalPages=Math.ceil(totalproducts/12)
        let currentPage = parseInt(req.query.page, 10) || 1;
        const skip=(currentPage-1)*12
        
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
                .populate('category')
                .skip(skip)
                .limit(12)
                .lean();
              
        } else {
            products =await  Product.find({status:'Active',gender:'female'}).populate('category')
            .skip(skip)
            .limit(12)
            .lean();
        }
          const category = await Category.find({})
         

          const  product= products.filter(product => {
            return (
                product.category && 
                product.category.Status === 'Active' 
            );
        });
       
          res.render('women',{product,category,user,track,currentPage,totalPages})
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
                .populate('category')
                .skip(skip)
                .limit(12)
                .lean();
              
        } else {
            products =await  Product.find({status:'Active',gender:'female'}).populate('category')
            .skip(skip)
            .limit(12)
            .lean();
        }
          const category = await Category.find({})

          const  product= products.filter(product => {
            return (
                product.category && // Ensure category is populated
                product.category.Status === 'Active' // Filter based on category status
            );
        });
          res.render('women',{product,category,user,track,currentPage,totalPages})
         
          
      }
        
        
    } catch (error) {
        console.log(error.message)
    }
}

//forgetpassword----------------------------------

const forgetpassword =async(req,res)=>{
    try {
        res.render('forgetpassword')
    } 
    catch (error) {
        console.log(error.message);
    }
}

//MAIL SEND----------------------------

const forgetpasswordmailsend=async(req,res)=>{
    try {
         const mail=req.body.email
         const user=await User.findOne({email:mail})

         if(!user){
            // res.render('forgetpassword')
            return res.status(403).json({ message: ' User not found' });
         }
         else{
            const check=await user.verified
           
            if(check!==true){
                
                return res.status(403).json({ message: 'User not verified' });
            }
            else{
                const id=user._id
        
                const resetPasswordLink = `http://localhost:12/resetpassword?id=${id}`;
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
                        console.log(error.message);
                        return res.status(500).json({ message: 'Email sent failed' });
                    } else {
                        return res.status(200).json({ message: 'Email sent successfully' });
                        
                    }
                });
        


            }

            }

         //console.log(mail)


    } catch (error) {
        console.log(error.message);
    }
}


//reset password laod-------------------------------------

const resetpasswordload=async(req,res)=>{
    try {
        const id=req.query.id
    
        res.render('resetpassword',{id})
        
    } catch (error) {
        console.log(error.message)
    }
}

//reset password---------------------------------
const resetpassword = async (req, res) => {
    try {
        const id = req.query.id;
        console.log(id)
        const pass1 = req.body.password1;
        const hashedPassword = await passwordhash(pass1);
        const user = await User.findOne({ _id: id });
 


            if (user) {
                const update = await User.updateOne({ _id: id }, { $set: { password: hashedPassword } });
               console.log(update)
                if (update.modifiedCount > 0) {
                    // Password changed successfully
                    return res.status(200).json({ message: 'Password changed successfully' });
                    req.session.reset=null
                } else {
                    // Password not changed 
                    return res.status(400).json({ message: 'Password not changed. Please try again.' });
                }
            } else {
                // User not found
                return res.status(404).json({ message: 'User not found' });
            }

        
        
        
    } catch (error) {
        console.log(error.message);
        return res.status(500).json({ message: 'Internal Server Error' });
    }
};


//Profile load 

const profileload =async(req,res)=>{
    try {
        const id=req.session.userid
        if(id){
            const user=await User.findOne({email:id,verified:true})
            const uid=user._id
            const track=true
            const order=await Order.find({userid:uid})
                if(order){
                    res.render('profile',{user,order,track})
                    
                }
                else{
                    res.render('profile',{user,track})
                }

        }
        else{
            res.redirect('/login')
        }
       
        
        
    } catch (error) {
        console.log(error.message);
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
        console.log(error.message);
        return res.status(500).json({ message: 'Internal Server Error' });
    }
}


//updatepassword------------------------------------------------


const updatepassword=async(req,res)=>{
    try {
        const uid=req.query.id
       
        const {currentPassword,newPassword}=req.body
        //console.log(currentPassword,newPassword)
        const user= await User.findOne({_id:uid})
        //console.log(user)
        if(!user){
            //console.log('user not found')

            res.json({message:'User not found'})
        }
        else{

            const pass=user.password
            
          
            const passwordMatch = await bcrypt.compare(currentPassword, pass);
            
            if(passwordMatch){
               // console.log('rupdated')
                const hashedNewPassword = await bcrypt.hash(newPassword, 10);
                user.password=hashedNewPassword
                user.save()
                res.json({message:'Password Updated '})
            }
            else{
                //console.log('password dont match')
                res.json({message:'Enterd wrong password'})
            }

        }
        
        

    } catch (error) {
        res.json({message:'Failed to update password'})
        console.log(error.message)
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
                    //not updated
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
               
                //adress not prstt
            }


        }
        else{
            //user not found
            res.json({ success: false, message: 'User not found' });
        }
        
        
        


    } catch (error) {
        console.log(error.message)
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
        console.log(error.message)
    }
}


// edit adress post mesthod---------------------------

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
        console.log(error.message)
    }
}

// add address-------------------------------------------------


const addaddress=async(req,res)=>{

    try {
        res.render('addaddress')
        
    } catch (error) {
        console.log(error.message)
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
                    //not updated
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
           
                    res.redirect(`/checkout?uid=${64378}`)
                    
                } else {
                    res.json({ success: false, message: 'Failed to add address' });
                }
               
                //adress not prstt
            }


        }
        else{
            //user not found
            res.json({ success: false, message: 'User not found' });
        }
        
        
        


    } catch (error) {
        console.log(error.message)
    }
}
//cancel order-----------------------



const cancelorder = async (req, res) => {
    try {
        const index = req.query.index;
        const oid = req.query.oid;

        const order = await Order.findOne({ _id: oid });
        const prod = order.products[index];
        const pid = prod.productid;

        if (prod) {
            // Product found
            const producttotal = prod.totalprice;
            let pquantity = prod.quantity;

            const ordertotal = order.total;
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
                        // No products left in the order, delete the cart
                        const a=await Order.deleteOne({ _id: oid });
                        console.log(a)

                        res.redirect('/profile');
                    } else {
                        res.redirect('/profile');
                    }
                } else {
                    // Failed to update product
                    console.log(1)
                    res.json({
                        success: false,
                        message: 'Failed to update product',
                    });
                }
            } else {
                // Failed to update order
                console.log('2')
                res.json({
                    success: false,
                    message: 'Failed to update order',
                });
            }
        } else {
            // No product found
            console.log('3')
            res.json({
                success: false,
                message: 'Product not found in order',
            });
        }
    } catch (error) {
        console.log(error.message);
        res.json({
            success: false,
            message: 'Error canceling order',
        });
    }
};

// returnproduct -----------------------------------------


const returnproduct= async(req,res)=>{
    try {
        const{reason,index,orderId}=req.body
        const order=await Order.findOne({_id:orderId})
        console.log(order)
        order.products[index].status='Return Request'
        order.products[index].return=reason
        const updated= await order.save()

        if(updated){
            res.json({success:true})
            console.log('updated')
        }
        else{
            res.json({success:false})
            //console.log('updation failed')
        }
    } catch (error) {
        res.json({success:false})
        //console.log(error.message)
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
    createaddress,
    editaddress,
    editaddresspost,
    addaddress,
    addaddresspost,
    cancelorder,
    returnproduct

}