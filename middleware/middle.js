const { findOne } = require("../models/adminmodels");

const islogin=async(req,res,next)=>{
    try {
        
        if(req.session.userid){
            next();

        }
        else{
            res.render('/')

        }


    } catch (error) {
        console.log(error.message);
    }
}

const islogout=async(req,res,next)=>{

    try {
        if(req.session.userid){
           
            res.redirect('/')
           
        }
        else{
            next();
           
        }
    } catch (error) {
        console.log(error.message);
    }
}
const isblock=async(req,res,next)=>{
    if(req.session.userid){
     
        const mail= req.session.userid
        const blockcheck= await findOne({email:mail})
        const check=blockcheck.status

        if(check==='Blocked'){

            res.redirect('/')
        }
        else{
            next();
        }
    }
    else{
        next();
    }


}


module.exports={
    islogin,
    islogout,
    isblock
}