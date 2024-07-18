const express = require('express')
const app = express()
const path = require('path')
const dotenv = require('dotenv')
const nocache = require('nocache')
const mongoose = require('mongoose')
const adminRoute = require('./routes/admin')
const userRoute = require('./routes/user')
const route = require('./routes/routes')
const cookieParser = require('cookie-parser')
const session = require('express-session')
const cookieSession = require('cookie-session');

dotenv.config()

app.set('view engine', 'ejs')


app.use(nocache())
app.use(express.json())
app.use(cookieParser())
app.use(express.urlencoded({ extended: false }))
app.use('/assets', express.static(path.join(__dirname, '/assets')));
app.use('/uploads',express.static('uploads'))

app.use(session({
    secret: 'secret_key',
    resave: false,
    saveUninitialized: true,
}));

// app.use('/assets/css',express.static(path.resolve('/src/views/css')))

async function serverOn() {
    try {
        await mongoose.connect(process.env.MONGO_URI ||'mongodb://localhost:27017/Meat&Greet')
        console.log("db connected")
    }catch(error){
        console.log(`failed to start the server. ${error}`)
    }
}

serverOn()

app.use('/',(req, res, next) => {
    console.log(`Request received method : ${req.method} and route : ${req.originalUrl}`);
    next(); // Pass control to the next middleware
});

app.use('/',route);
app.use('/user',userRoute);
app.use('/admin',adminRoute);

app.use("**", (req,res)=>{
    res.send("Page not found");
});

app.listen(process.env.PORT || 3000, () => {
    console.log("server running at http://localhost:3000")
})