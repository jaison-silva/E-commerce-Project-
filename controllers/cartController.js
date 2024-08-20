const userModel = require('../models/userModel')
const cartModel = require('../models/cartModel')
const productModel = require('../models/productModel')
const jwt = require('jsonwebtoken')
const cart = require('../models/cartModel')
const addressModel = require('../models/addressModel')
const couponModel = require('../models/couponModel')

exports.viewCart = async (req, res) => {
    try {
        const token = req.cookies.userJwtAuth;
        const decode = jwt.verify(token, "secret_key");

        const user = await userModel.findOne({ email: decode.email })
        // console.log(user._id)

        if (!user) {
            console.log("user not found")
            return res.send("user not found")
        }

        const rawCart = await cartModel.findOne({ user: user._id, })
            .populate({
                path: 'products.productId',
                populate: {
                    path: 'category',
                }
            });

        if (rawCart) {
            if (rawCart.products.length > 0) {
                rawCart.products.map(async (product) => {
                    if (product.listing == false) {
                        await cartModel.deleteOne({ _id: product._id })
                    }
                })
            }
        }

        // console.log("FFFFFFF",cart)

        const cart = await cartModel.findOne({ user: user._id, })
            .populate({
                path: 'products.productId',
                populate: {
                    path: 'category',
                }
            });

        let totalAmount = 0;

        if (cart && cart.products.length > 0) {
            cart.products.forEach(item => {
                totalAmount += item.productId.rate * item.quantity;
            });
        }


        return res.render('user/cart', { user, cart, totalAmount });

    } catch (e) {
        console.error(e);
        res.status(401).send('Unauthorized' + e);
    }
}

exports.addToCart = async (req, res) => {
    try {
        const token = req.cookies.userJwtAuth
        const decoded = jwt.verify(token, 'secret_key');
        const user = await userModel.findOne({ email: decoded.email });
        const productId = req.body.id;
        let {quantity = 1} = parseInt(req.query);
        console.log("Trriggere" + quantity)

        let cart = await cartModel.findOne({ user: user._id });

        // If no Cart  = Create One
        if (!cart) {
            cart = new cartModel({
                user: user._id,
                products: [{
                    productId,
                    quantity
                }]
            });
        } else {
            // 4. Find the Product Index in the Cart
            const productIndex = cart.products.findIndex(item => item.productId.toString() === productId);
            console.log("productInde  " + productIndex)

            if (productIndex > -1) {
                console.log(cart.products[productIndex].quantity)
                cart.products[productIndex].quantity += quantity;
                console.log(cart.products[productIndex].quantity)
                if (cart.products[productIndex].quantity > 5) {
                    cart.products[productIndex].quantity = 5;
                    await cart.save();
                    return res.json({ message: "excess" })
                }
            } else {
                // Product not in cart, add it
                cart.products.push({
                    productId,
                    quantity,
                });
            }
        }
        await cart.save();
        res.status(200).json({ message: "success", cart }); 

    } catch (e) {
        console.error(e);
        res.status(401).send('Unauthorized');
    }
}

exports.updateQuantity = async (req, res) => {
    try {
        console.log("triggered!");

        const token = req.cookies.userJwtAuth;

        console.log(req.body.action, req.body.productId);

        const decode = jwt.verify(token, "secret_key");

        const user = await userModel.findOne({ email: decode.email });

        const { action, productId } = req.body;

        const cart = await cartModel.findOne({ user: user._id });
        if (!cart) {
            return res.status(404).json({ success: false, message: 'Cart not found' });
        }

        const productIndex = cart.products.findIndex(p => p.productId.toString() === productId);
        if (productIndex === -1) {
            return res.status(404).json({ success: false, message: 'Product not found in cart' });
        }

        let newQuantity = cart.products[productIndex].quantity;
        if (action === 'increment') {
            newQuantity += 1;
        } else if (action === 'decrement') {
            newQuantity -= 1;
        }

        if (newQuantity < 1) newQuantity = 1;
        if (newQuantity > 5) {
            return res.json({ success: false, message: 'Quantity cannot exceed 5' });
        }

        cart.products[productIndex].quantity = newQuantity;
        await cart.save();

        res.json({ success: true, newQuantity });
    } catch (error) {
        console.error('Error updating quantity:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};

exports.renderCheckout = async (req, res) => {
    try {
        const token = req.cookies.userJwtAuth;
        const decode = jwt.verify(token, "secret_key");

        const user = await userModel.findOne({ email: decode.email })
        user.wallet = user.wallet.toFixed(2)
        // console.log(user._id)

        if (!user) {
            console.log("user not found")
            return res.send("user not found")
        }

        // cart validation for listing of the product
        const cartAuth = await cartModel.findOne({ user: user._id }).populate({
            path: 'products.productId',
            populate: {
                path: 'category'
            }
        });

        cartAuth.products.forEach(async (products) => {
            if (products.listing == false) {
                await cartModel.deleteOne({ _id: products._id })
            }
        })

        //done

        const cart = await cartModel.findOne({ user: user._id }).populate({
            path: 'products.productId',
            populate: {
                path: 'category'
            }
        });

        const address = await addressModel.find({ user: user._id })

        const coupon = await couponModel.find()
        coupon.map(async (element) => {
            if (element.isExpired()) {
                element.isActive = "Expired"
                await element.save()
            }
        });

        const coupons = await couponModel.find({ isActive: "Active" })


        if (cart || cart.products.length > 0) {
            let totalAmount = 0;
            cart.products.forEach(item => {
                totalAmount += item.productId.rate * item.quantity;
            });

            const filteredCoupons = coupons.filter((coupon) => {
                return totalAmount > coupon.minimumPurchaseAmount
            })

            res.render('user/checkout', { user, cart, totalAmount, address, filteredCoupons });
        } else {
            res.redirect('/user/viewCart', { user, cart });
        }

    } catch (e) {
        console.log(e);
        res.status(500).send("Error!");
    }
}

exports.getCouponData = async (req, res) => {
    try {
        const id = req.params.id;

        // Find the coupon by its ID
        const coupon = await couponModel.findById(id);

        if (!coupon) {
            return res.status(404).json({ error: 'Coupon not found' });
        }

        // Send the coupon details as a JSON response
        return res.status(200).json({
            code: coupon.code,
            discountPercentage: coupon.discountPercentage,
            minimumPurchaseAmount: coupon.minimumPurchaseAmount,
            isActive: coupon.isActive,
            expiryDate: coupon.expiryDate,
        });
    } catch (error) {
        console.error('Error fetching coupon data:', error);
        return res.status(500).json({ error: 'Internal Server Error' });
    }
};

exports.orderPlaced = (req, res) => {
    try {
        res.render('user/orderPlaced')
    } catch (e) {
        console.log(e)
        res.status(500).json({ message: " error loading the page" + e })
    }
}
exports.deleteProduct = async (req, res) => {
    try {
        const token = req.cookies.userJwtAuth
        const decoded = jwt.verify(token, "secret_key")
        const user = await userModel.findOne({ email: decoded.email })
        const id = req.params.id

        let response = await cartModel.findOneAndUpdate(
            { user: user._id },
            { $pull: { products: { productId: id } } },
            { new: true } // Return the updated document
        );
        if (response) {
            res.status(200).json({ message: "Successfully deleted" })
        } else {
            res.status(500).json({ message: 'Server Error' })
        }
    } catch (e) {
        console.log(e)
        res.status(500).send("Failed to delete")
    }
}