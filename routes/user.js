const express = require('express')
const route = express.Router()
const { userJwtAuth } = require('../middleware/checkUserCookie');
const googleController = require('../controllers/googleSetup')
const {userDataGetter} = require('../middleware/userData')
const {checkUserStatus} = require('../middleware/checkUserStatus')


const controller = require('../controllers/userController')
const profileController = require('../controllers/profileController')
const wishlistControler = require('../controllers/wishlistControler')
const cartController = require('../controllers/cartController')


route.get('/login', controller.loginPage)
route.get('/logout', controller.logout)
route.get('/signup', controller.signup)
route.get('/forgot', controller.forgot)
route.patch('/updatePassword', controller.updatePassword)

// route.post('/upload',controller.upload)

route.get('/category',userDataGetter,checkUserStatus, controller.category)

route.get('/products',userDataGetter,checkUserStatus, userJwtAuth, controller.products)

route.get('/category/products/:id',userDataGetter,checkUserStatus, controller.cate_products)   //// question mark aded

route.get('/productDetailed/:id',userDataGetter,checkUserStatus, controller.productDetailed) 

route.post('/registerUser', controller.registerUser)

route.delete('/deleteAddress/:id',userDataGetter,checkUserStatus, profileController.deleteAddress)

route.delete('/deleteProduct/:id',userDataGetter,checkUserStatus, cartController.deleteProduct)

// route.delete('/editAddress/:id', profileController.editAddress)

// Profile routess
 
route.get('/profile',userDataGetter,checkUserStatus, userJwtAuth, profileController.profile)

route.get('/address',userDataGetter,checkUserStatus, userJwtAuth, profileController.address)

route.get('/orders',userDataGetter,checkUserStatus, userJwtAuth, profileController.orders)

route.patch('/cancelOrder/:id',userDataGetter,checkUserStatus, userJwtAuth, profileController.cancelOrder)

route.post('/addAddress',userDataGetter,checkUserStatus, userJwtAuth, profileController.addAdress)

route.get('/editAddress/:id',userDataGetter,checkUserStatus, userJwtAuth, profileController.editAddress)

route.patch('/updateAddress',userDataGetter,checkUserStatus, userJwtAuth, profileController.updateAddress)

route.patch('/updateProfile',userDataGetter,checkUserStatus, userJwtAuth, profileController.updateProfile)

// route.get('/wishlist', userJwtAuth, profileController.wishlist)

/// API

route.post('/sendOtp', controller.sendOtp)
route.post('/verifyOtp', controller.verifyOtp)
route.post('/api_login', controller.api_login)

route.get("/google",googleController.googleAuth)

route.get("/redirect", googleController.googleRedirect)

// Wishlist Routes
route.get('/viewWishlist',userDataGetter,checkUserStatus,wishlistControler.viewWishlist)
route.post('/addToWishList',userDataGetter,checkUserStatus,wishlistControler.addToWishList)
route.delete('/deleteFromWishList/:id',userDataGetter,checkUserStatus,wishlistControler.deleteFromWishList)


// Cart Routes
route.get('/viewCart',userDataGetter,checkUserStatus,cartController.viewCart)
route.post('/addToCart',userDataGetter,checkUserStatus,cartController.addToCart)
route.post('/updateQuantity',userDataGetter,checkUserStatus, cartController.updateQuantity);

route.get('/checkout',userDataGetter,checkUserStatus, cartController.renderCheckout)
route.get('/orderPlaced',userDataGetter,checkUserStatus, cartController.orderPlaced)
route.post('/placeOrder',userDataGetter,checkUserStatus,controller.placeOrder);

//Wallet History Routes
route.get('/walletHistory',userDataGetter,checkUserStatus, profileController.walletHistory)

module.exports = route