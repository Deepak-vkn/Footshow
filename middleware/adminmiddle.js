
const islogin=async(req,res,next)=>{
    try {
        
        if(req.session.admintrack){
            next();

        }
        else{
            res.redirect('/admin')

        }


    } catch (error) {
        console.log(error.message);
    }
}

const islogout=async(req,res,next)=>{

    try {
        if(req.session.admintrack){
           
            res.redirect('/admin/dashboard')
           
        }
        else{
            next();
           
        }
    } catch (error) {
        console.log(error.message);
    }
}


module.exports={
    islogin,
    islogout,
}