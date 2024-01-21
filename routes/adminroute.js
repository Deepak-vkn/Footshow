const express=require('express')
const route=express()
const admincontroll=require('../controllers/admincontroll')
const productcontroll=require('../controllers/productcontroll')
const bodyparser=require('body-parser')
const path = require('path')
const adminmiddle=require('../middleware/adminmiddle')
const confi=require("../configuration/confi")
route.use(express.static('public'))
route.use(bodyparser.json())
route.use(bodyparser.urlencoded({extended:true}))
const multer = require('multer');
const session=require('express-session')
route.set('view engine','ejs')
route.set('views','views/admin')

route.use(
  session({
      secret:confi.confi,
      resave: false,
      saveUninitialized: false
  })
);

// const storage = multer.diskStorage({
//     destination: function (req, file, cb) {
//         const destinationPath = path.join(__dirname, '../public/images');
//         cb(null, destinationPath);
//     },
//     filename: function (req, file, cb) {
//         cb(null, Date.now() + '-' + file.originalname); // 
//     }
// });

const storage = multer.diskStorage({
    destination: function (req, file, cb) {
      cb(null, path.join(__dirname, '../public/images'));
      // cb(null, join(__dirname, '..', 'public', 'uploads')); // it is also applicable but that time enable {join} upward.
    },
    filename: function (req, file, cb) {
      const currentDate = new Date();
      const formattedDate = currentDate.toISOString().replace(/:/g, '-').replace(/\..+/, '');
      const name = formattedDate + '_' + file.originalname;
      cb(null, name);
    },
  });

const upload = multer({ storage: storage });









route.get('/',adminmiddle.islogout,admincontroll.loadlogin)
route.post('/',admincontroll.loginverify)
route.get('/dashboard',adminmiddle.islogin,admincontroll.laoddashbaord)
route.get('/users',adminmiddle.islogin,admincontroll.loaduser)
route.get('/block',adminmiddle.islogin,admincontroll.blockuser)
route.get('/unblock',adminmiddle.islogin,admincontroll.unblockuser)

//catagory
route.get('/category',adminmiddle.islogin,admincontroll.loadcategory)
route.post('/category',admincontroll.addcategory)
route.get('/addcata',adminmiddle.islogin,admincontroll.loaddcata)
route.post('/updatecata',admincontroll.updatecata)
route.get('/catablock',adminmiddle.islogin,admincontroll.catablock)
route.get('/cataunblock',adminmiddle.islogin,admincontroll.cataunblock)
route.get('/catadelete',admincontroll.catadelete)


//product
route.get('/productlist',adminmiddle.islogin,productcontroll.loadproduct)
route.get('/addproduct',adminmiddle.islogin,productcontroll.loadaddproduct)
route.post('/addproduct', upload.array('image', 10), productcontroll.addproduct);
route.get('/productblock',adminmiddle.islogin,productcontroll.blockproduct)
route.get('/productunblock',adminmiddle.islogin,productcontroll.productunblock)
route.get('/deleteproduct',productcontroll.deleteproduct)
route.get('/editproduct',adminmiddle.islogin,productcontroll.loadeditproduct)
//route.post('/editproduct',upload.array( 'replaceImages', 5),productcontroll.editproduct)
route.post('/editproduct', upload.fields([{ name: 'newImages', maxCount: 4 }, { name: 'replaceImages', maxCount: 4 }]), productcontroll.editproduct);
// route.post('/editproduct', upload.fields([{ name: 'replaceImages', maxCount: 10 }]), productcontroll.editproduct);
route.get('/deleteimage',adminmiddle.islogin,productcontroll.deleteimage)
route.get('/logout',admincontroll.logout)

//orders

route.get('/orders',adminmiddle.islogin,admincontroll.loadorder)
route.post('/orderstatus',admincontroll.orderstatus)


module.exports=route
