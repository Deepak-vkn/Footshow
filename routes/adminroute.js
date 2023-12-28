const express=require('express')
const route=express()
const admincontroll=require('../controllers/admincontroll')
const bodyparser=require('body-parser')
const path = require('path')
route.use(express.static('public'))
route.use(bodyparser.json())
route.use(bodyparser.urlencoded({extended:true}))

route.set('view engine','ejs')
route.set('views','views/admin')



route.get('/',admincontroll.loadlogin)
route.post('/',admincontroll.loginverify)
route.get('/dashboard',admincontroll.laoddashbaord)
route.get('/users',admincontroll.loaduser)
route.get('/adduser',admincontroll.loadadduser)
route.post('/adduser',admincontroll.adduser)
route.get('/block',admincontroll.blockuser)
route.get('/unblock',admincontroll.unblockuser)
route.get('/category',admincontroll.loadcategory)
route.post('/category',admincontroll.addcategory)
route.get('/addcata',admincontroll.loaddcata)
route.post('/updatecata',admincontroll.updatecata)
route.get('/catablock',admincontroll.catablock)
route.get('/cataunblock',admincontroll.cataunblock)


module.exports=route
