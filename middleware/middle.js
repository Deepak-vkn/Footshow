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

module.exports={
    islogin,
    islogout
}