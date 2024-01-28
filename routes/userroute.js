const express=require('express')
const route=express();
const usercontroll=require('../controllers/usercontroll')
const cartcontroll=require('../controllers/cartcontroll')
const checkoutcontroll=require('../controllers/checkoutcontroll')
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
route.get('/otpgenerte',usercontroll.otpgenerte)
route.get('/logout',usercontroll.logout)
route.get('/shop',usercontroll.loadshop)
route.get('/singleproduct',usercontroll.loadsingleproduct)
route.get('/men',usercontroll.loadmen)
route.get('/women',usercontroll.loadwomen)
route.get('/forgetpassword',usercontroll.forgetpassword)
route.post('/forgetpassword',usercontroll.forgetpasswordmailsend)
route.get('/resetpassword',usercontroll.resetpasswordload) 
route.post('/resetpassword',usercontroll.resetpassword)   



//profile

route.get('/profile',usermiddle.islogin,usercontroll.profileload)
route.post('/profile',usermiddle.islogin,usercontroll.profileedit)
route.post('/updatepassword',usermiddle.islogin,usercontroll.updatepassword)
route.post('/createaddress',usermiddle.islogin,usercontroll.createaddress)
route.get('/editaddress',usermiddle.islogin,usercontroll.editaddress)
route.post('/editaddress',usermiddle.islogin,usercontroll.editaddresspost)
route.get('/addaddress',usermiddle.islogin,usercontroll.addaddress)
route.post('/addaddress',usermiddle.islogin,usercontroll.addaddresspost)
route.get('/cancelorder',usermiddle.islogin,usercontroll.cancelorder)
route.post('/returnproduct',usercontroll.returnproduct)

//cart

route.post('/addtocart',cartcontroll.addtocart)
route.get('/cart',usermiddle.islogin,cartcontroll.loadcart)
route.post('/cartupdate',usermiddle.islogin,cartcontroll.updateacart)
route.get('/removecart',usermiddle.islogin,cartcontroll.removecart)
route.post('/stockcheck',usermiddle.islogin,cartcontroll.stockcheck)



//checkout

route.get('/checkout',usermiddle.islogin,checkoutcontroll.loadcheckout)
route.post('/checkout',usermiddle.islogin,checkoutcontroll.payment)
route.get('/success',checkoutcontroll.ordersuccess)
route.post('/verifypayment',checkoutcontroll.verifypayment)




















module.exports=route;