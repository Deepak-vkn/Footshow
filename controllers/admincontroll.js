

const Admin=require('../models/adminmodels')
const User=require('../models/usermodel')
const Product=require('../models/product')
const Category=require('../models/category')
const Cart=require('../models/cart')
const Order=require('../models/orders')
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

        const data=await User.find({verified:true})
       
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
        const category= await Category.find({is_delete:false})
        res.render('category',{category})
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
        const id=req.query.id

        const cata= await Category.findOne({_id:id})
        
        const category= await Category.find({})

        res.render('category',{cata,category})



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
        const order= await Order.find()
      


        
        res.render('orders',{order})
    } catch (error) {
        console.log(error.message)
        
    }

}


// update status-----------------------------------------------------


const orderstatus=async(req,res)=>{

    try {
        const { status, orderId}=req.body
       
        const order= await Order.findOne({_id:orderId})
       
        if(order){
  const updatedorder= await Order.findOneAndUpdate({_id:orderId},{
    $set:{status:status}
  })
      if(updatedorder){
        res.json({success:true,message:"Status Updated"})
      }
      else{
        res.json({success:false,message:"Failed to update status"})
      }
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
    orderstatus

}