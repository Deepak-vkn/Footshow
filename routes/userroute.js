const express=require('express')
const route=express();
const usercontroll=require('../controllers/usercontroll')
route.use(express.static('public'))
const bodyparser=require('body-parser')
route.set('view engine','ejs')
route.set('views','views/user')
const session=require('express-session')
const confi=require("../configuration/confi")
const usermiddle=require('../middleware/middle')
route.use(bodyparser.json())
route.use(bodyparser.urlencoded({extended:true}))
route.use(
    session({
        secret:confi.confi,
        resave: false,
        saveUninitialized: false
    })
);

route.get('/',usercontroll.home)
route.get('/login',usermiddle.islogout,usercontroll.loadlogin)
route.post('/login',usercontroll.verifylogin)
route.get('/register',usercontroll.loadregister)
route.post('/register',usercontroll.register)
route.get('/otp',usercontroll.loadotp)
route.post('/otp',usercontroll.verifyotp)
route.get('/logout',usercontroll.logout)
route.get('/shop',usercontroll.loadshop)
route.get('/singleproduct',usercontroll.loadsingleproduct)
route.get('/men',usercontroll.loadmen)
route.get('/women',usercontroll.loadwomen)
route.get('/forgetpassword',usercontroll.forgetpassword)
route.post('/forgetpassword',usercontroll.forgetpasswordmailsend)
route.get('/resetpassword',usercontroll.resetpasswordload) 
route.post('/resetpassword',usercontroll.resetpassword)   
route.get('/profile',usercontroll.profileload)
route.post('/profile',usercontroll.profileedit)























module.exports=route;