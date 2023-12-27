const { logout } = require("./usercontroll")

const Admin=require('../models/adminmodels')
const User=require('../models/usermodel')
const bcrypt=require('bcrypt')

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

const laoddashbaord=async(re,res)=>{
    try {
        console.log('rewched dash');
        res.render('dashboard')

    } catch (error) {
        console.log(error.message);
    }
}

//load user--------------------------------------

const loaduser=async(req,res)=>{
    try {

        const data=await User.find({})
       
        res.render('users',{user:data})
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

//add new user-------------------------------------


const adduser =async(req,res)=>{
    try {
        const name=req.body.name
       const  mail=req.body.email
       const  password=req.body.password
       const hashed= await passwordhash(password)
          
       const check=await User.findOne({email:mail})

       if(check){
        let message='User already exist'
        res.render('adduser',{message})

       }
       else{
        const user=await new User({
            name:req.body.name,
            email:req.body.email,
            password:hashed,
            verified:true
           })
           
           await user.save()
           res.redirect('/admin/users')

       }
       
      

    } catch (error) {
        console.log(error.message);
    }
}

//bloackuser------------------------------------------
const blockuser=async(req,res)=>{
    try {
        const id= req.query.id
        const user=await User.findOne({_id:id})

        if(user){
        

            await User.updateOne({_id:id},{$set:{status:'Blocked'}})
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
  
module.exports={
    loadlogin,
    loginverify,
    laoddashbaord,
    loaduser,
    loadadduser,
    adduser,
    blockuser,
    unblockuser
}