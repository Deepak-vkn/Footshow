const express=require('express')
const route=express();
const usercontroll=require('../controllers/usercontroll')
route.use(express.static('public'))
const bodyparser=require('body-parser')
route.set('view engine','ejs')
route.set('views','views/user')

route.use(bodyparser.json())
route.use(bodyparser.urlencoded({extended:true}))


route.get('/',usercontroll.home)
route.get('/login',usercontroll.loadlogin)
route.get('/register',usercontroll.loadregister)
route.post('/register',usercontroll.register)
route.get('/otp',usercontroll.loadotp)
route.post('/otp',usercontroll.verifyotp)
                      
























module.exports=route;