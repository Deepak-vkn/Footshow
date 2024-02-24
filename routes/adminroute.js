const express=require('express')
const route=express()
const admincontroll=require('../controllers/admincontroll')
const productcontroll=require('../controllers/productcontroll')
const catagorycontroll=require('../controllers/catagorycontroll')
const ordercontroll=require('../controllers/ordercontroll')
const couponcontroll=require('../controllers/couponcontroll')
const offercontroll=require('../controllers/offercontroll')
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


const storages = multer.diskStorage({
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

const uploads = multer({ storage: storage });






route.get('/',adminmiddle.islogout,admincontroll.loadlogin)
route.post('/',admincontroll.loginverify)
route.get('/dashboard',adminmiddle.islogin,admincontroll.laoddashbaord)
route.get('/users',adminmiddle.islogin,admincontroll.loaduser)
route.get('/block',adminmiddle.islogin,admincontroll.blockuser)
route.get('/unblock',adminmiddle.islogin,admincontroll.unblockuser)
route.get('/sales',admincontroll.loadsales)


//catagory
route.get('/category',catagorycontroll.loadcategory)
route.post('/category',catagorycontroll.addcategory)
route.get('/addcata',adminmiddle.islogin,catagorycontroll.loaddcata)
route.post('/updatecata',catagorycontroll.updatecata)
route.get('/catablock',adminmiddle.islogin,catagorycontroll.catablock)
route.get('/cataunblock',adminmiddle.islogin,catagorycontroll.cataunblock)
route.get('/catadelete',catagorycontroll.catadelete)




//product
route.get('/productlist',productcontroll.loadproduct)
route.get('/addproduct',adminmiddle.islogin,productcontroll.loadaddproduct)
route.post('/addproduct',adminmiddle.islogin, upload.array('image', 10), productcontroll.addproduct);
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

route.get('/orders',adminmiddle.islogin,ordercontroll.loadorder)
route.post('/orderstatus',ordercontroll.orderstatus)
route.post('/returnrequest',ordercontroll.returnrequest)




// coupon 

route.get('/coupon',adminmiddle.islogin,couponcontroll.couponload)
route.get('/addcoupon',adminmiddle.islogin,couponcontroll.addcouponlaod)
route.post('/addcoupon',couponcontroll.submitaddcoupon)
route.get('/editcoupon',adminmiddle.islogin,couponcontroll.loadedit)
route.post('/editcoupon',couponcontroll.editcoupon)
route.delete('/deletecoupon',couponcontroll.deletecoupon)



//offer

route.get('/offer',adminmiddle.islogin,offercontroll.offerload)
route.get('/addoffer',adminmiddle.islogin,offercontroll.loadaddoffer)
route.post('/addoffer',offercontroll.offerpost)
route.get('/editoffer',adminmiddle.islogin,offercontroll.editofferload)
route.post('/editoffer',offercontroll.editoffer)
route.get('/deleteoffer',adminmiddle.islogin,offercontroll.deleteoffer)
route.post('/offerapply',offercontroll.applyoffer)
 route.post('/removeoffer',offercontroll.removeoffer)
 route.post('/cataofferapply',offercontroll.applyoffercata)
 route.post('/cataremoveoffer',offercontroll.removecataoffer)



//banner

route.get('/banner',adminmiddle.islogin,admincontroll.loadbanner)
route.get('/addbanner',adminmiddle.islogin,admincontroll.loadaddbanner)
route.post('/addbanner', uploads.single('image'), admincontroll.addbanner);
route.get('/editbanner',adminmiddle.islogin,admincontroll.loadeditbanner)
route.post('/editbanner',uploads.single('image'),admincontroll.editbanner)
route.delete('/deletebanner',admincontroll.deletebanner)


route.get('/500',admincontroll.load500)


module.exports=route
