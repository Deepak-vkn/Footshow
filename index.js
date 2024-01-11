const { log } = require('console');
const express=require('express')
const app=express();
const userroute=require('./routes/userroute')
const adminroute=require('./routes/adminroute')
const mongoose=require('mongoose')
const nocache=require('nocache')
const flash = require('express-flash');

app.use(flash());
const port=12;


app.use(nocache())
mongoose.connect('mongodb://localhost:27017/footshow')
app.use('/',userroute)

app.use('/admin',adminroute)









app.listen(port,()=>{
    console.log("http://localhost:12/");
})