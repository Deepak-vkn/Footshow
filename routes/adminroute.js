const express=require('express')
const route=express()
const admincontroll=require('../controllers/admincontroll')
const productcontroll=require('../controllers/productcontroll')
const bodyparser=require('body-parser')
const path = require('path')
route.use(express.static('public'))
route.use(bodyparser.json())
route.use(bodyparser.urlencoded({extended:true}))
const multer = require('multer');

route.set('view engine','ejs')
route.set('views','views/admin')



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
route.get('/productlist',productcontroll.loadproduct)
route.get('/addproduct',productcontroll.loadaddproduct)
route.post('/addproduct', upload.array('image', 5), productcontroll.addproduct);
route.get('/productblock',productcontroll.blockproduct)
route.get('/productunblock',productcontroll.productunblock)
route.get('/editproduct',productcontroll.loadeditproduct)

module.exports=route
