const { log } = require('console');
const express=require('express')
const app=express();
const userroute=require('./routes/userroute')
const mongoose=require('mongoose')

const port=12;



mongoose.connect('mongodb://localhost:27017/footshow')
app.use('/',userroute)








app.listen(port,()=>{
    console.log("http://localhost:12/");
})