const { log } = require('console');
const express=require('express')
const app=express();
const userroute=require('./routes/userroute')
const adminroute=require('./routes/adminroute')
const mongoose=require('mongoose')
const nocache=require('nocache')
const flash = require('express-flash');

require('dotenv').config();
app.use(flash());
// const port=12;
const port = process.env.PORT || 3000;


app.use(nocache())
// mongoose.connect('mongodb://localhost:27017/footshow')
mongoose.connect(process.env.MONGODB_URI);
app.use('/admin',adminroute)
app.use('/',userroute)





app.listen(port,()=>{
    console.log("http://localhost:12/");
})