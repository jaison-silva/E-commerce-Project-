const Category = require('../models/categoryModel')
const Product = require('../models/productModel')
const userModel = require('../models/userModel')
const orderModel = require('../models/orderModel')
const cartModel = require('../models/cartModel')
const addressModel = require('../models/addressModel')
const nodemailer = require('nodemailer');
const jwt = require('jsonwebtoken');
const { mongoose } = require('mongoose');


exports.loginPage = (req, res) => {
    res.render('user/login');
}

exports.forgot = async (req, res) => {
    if (req.cookies.userJwtAuth) {
        const token = req.cookies.userJwtAuth;
        const decoded = jwt.verify(token, "secret_key")

        const response = await userModel.findOne({email: decoded.email})

        if(!response.password){
            return res.redirect('/user/profile?msg=noPass')
        }

        return res.render('user/forgotPassword', { user: decoded.email });
    } else {
        return res.render('user/forgotPassword', { user: "loggedout" });
    }
}

exports.api_login = async (req, res) => {
    let { email, password } = req.body;
    console.log(email, password);

    try {
        const user = await userModel.findOne({ email: email });
        console.log(user);

        if (!user) {
            return res.redirect('/user/login?msg=email'); // No user found with the given email
        }

        if (!user.status) {
            return res.redirect('/?msg=blocked');
        }

        if (user.password === password) {
            const token = { email: email };
            const userToken = jwt.sign(token, "secret_key", {
                expiresIn: '4h'
            });

            res.cookie('userJwtAuth', userToken, {
                httpOnly: true,
                maxAge: 4 * 60 * 60 * 1000 // 4 hours in milliseconds
            });

            return res.redirect('/?msg=success');
        } else {
            return res.redirect('/user/login?msg=password'); // Password does not match
        }
    } catch (err) {
        console.error('Error during login:', err);
        return res.status(500).send('Internal Server Error');
    }
};

exports.logout = async (req, res) => {
    try {
        res.clearCookie('userJwtAuth');
        res.redirect('/?msg=loggedout');
    } catch (e) {
        console.log(e);
        res.status(500).send("Error");
    }
}

exports.signup = (req, res) => {
    res.render('user/signup')
}

exports.sendOtp = (req, res) => {
    try {

        console.log("Triggered! back")
        let email = req.body.email;
        console.log(email + "back");

        // otp verification
        const transport = {
            host: "smtp.gmail.com",
            port: 465,
            secure: true,
            auth: {
                user: "jaisonsilva303@gmail.com",
                pass: "bolg wysf cirq dxsa"
            }
        }

        const otp = Math.floor(Math.random() * (9999 - 1000 + 1)) + 1000;
        // console.log(otp);

        let transporter = nodemailer.createTransport(transport);
        const mailContent = {
            from: "jaisonsilva303@gmail.com",
            to: `${email}`,
            subject: "This is the otp for the sign up for MEAT & GREET",
            text: `Your otp is: ${otp}`
        }

        transporter.sendMail(mailContent, (err) => {
            if (err) {
                console.log(otp);
                console.error(err);
                res.status(500).json({ error: 'Failed to send OTP' }); // Send an error response
            } else {
                // Store the OTP in session or database
                console.log(otp);
                res.cookie('otp', otp, { maxAge: 30000, httpOnly: true })
                res.status(200).json({ message: 'OTP sent successfully' }); // Send a success response
            }
        });
    } catch (err) {
        console.log(err)
        res.status(500).send(err)
    }
};

exports.updatePassword = async (req, res) => {
    const { email, pass } = req.body;
    console.log("we reached theback " + email, pass)

    try {
        // Use findOneAndUpdate to find the user by email and update the pass
        const updatedUser = await userModel.findOneAndUpdate(
            { email: email },
            { password: pass },
            { new: true } // To return the updated document
        );


        if (!updatedUser) {
            return res.status(404).json({ error: 'User not found' });
        }

        res.status(200).json({ message: 'Password updated successfully' });
    } catch (error) {
        console.error('Error updating password:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
}

exports.verifyOtp = (req, res) => {
    try {
        let { otp } = req.body;
        console.log('Triggered verifyOtp with OTP:', otp);

        const storedOtp = req.cookies.otp;

        if (!storedOtp) {
            console.log('expired')
            return res.status(200).json({ message: "Expired" });
        }

        if (otp === storedOtp) {
            console.log('veri')
            return res.status(200).json({ message: "Verified" });
        } else {
            console.log('invvalid')
            return res.status(200).json({ message: "Invalid" });
        }
    } catch (err) {
        console.log(err)
        res.status(500).send(err)
    }
};

exports.registerUser = async (req, res) => {
    try {
        let { name, email, password } = req.body;
        const data = new userModel({ name, email, password, wallet: 0 });

        await data.save();
        console.log("Data saved to DB");
        res.clearCookie('otp');

        const token = {
            email: email
        }

        const userToken = jwt.sign(token, "secret_key", {
            expiresIn: '4h'
        });

        res.cookie('userJwtAuth', userToken, {
            httpOnly: true,
            maxAge: 4 * 60 * 60 * 1000 // 4 hours in milliseconds
        });

        res.redirect('/');
    } catch (err) {
        console.error("There was an error saving the data: ", err);
        res.status(500).send("There was an error saving the data");
    }
}

exports.category = async (req, res) => {
    try {
        const data = await Category.find()
        if (req.cookies && req.cookies.userJwtAuth) {
            res.render('user/category', { data, user: true })
        } else {
            res.render('user/category', { data, user: false })
        }
    } catch (err) {
        console.log(err)
        res.status(500).send(err)
    }
}

exports.products = async (req, res) => {
    try {
        const data = await Product.find().populate('category')
        console.log(data);
        if (req.cookies && req.cookies.userJwtAuth) {
            res.render('user/products', { data, user: true })
        } else {
            res.render('user/products', { data, user: false })
        }
    } catch (err) {
        console.log(err)
        res.status(500).send(err)
    }
}

exports.cate_products = async (req, res) => {
    try {
        const data = await Product.find({ category: req.params.id }).populate('category')
        console.log(data);
        if (req.cookies && req.cookies.userJwtAuth) {
            res.render('user/products', { data, user: true })
        } else {
            res.render('user/products', { data, user: false })
        }
    } catch (err) {
        console.log(err)
        res.status(500).send(err)
    }
}

exports.productDetailed = async (req, res) => {
    try {
        const data = await Product.findById(req.params.id).populate('category');
        const similar = await Product.find().populate('category').limit(4);
        // console.log(data);
        if (req.cookies && req.cookies.userJwtAuth) {
            res.render('user/productDetailed', { data, user: true, similar })
        } else {
            res.render('user/productDetailed', { data, user: false, similar })
        }
    } catch (err) {
        console.log(err)
        res.status(500).send(err)
    }
}


exports.placeOrder = async (req, res) => {
    try {
        // console.log(req.body)
        const token = req.cookies.userJwtAuth;
        const decoded = jwt.verify(token, "secret_key");


        const { addressId, cartId, PaymentMethod, paymentStatus } = req.body

        const [usercart, address, user] = await Promise.all([
            cartModel.findById(cartId).populate("products.productId"),
            addressModel.findById(addressId),
            userModel.findOne({ email: decoded.email }),
        ])

        // console.log(addressId, cartId, PaymentMethod, user)

        const orderedItems = usercart.products.map((item) => {
            return {
                productId: item.productId,
                price: item.productId.rate,
                quantity: item.quantity,
            };
        });

        let totalAmount = 0;
        usercart.products.forEach(item => {
            totalAmount += item.productId.rate * item.quantity;
        });

        if (PaymentMethod == "M&G Wallet") {
            console.log("walet debit triggereds")
            const updatedUser = await userModel.findOneAndUpdate(
                { email: decoded.email },
                { $inc: { wallet: -totalAmount } },
                { new: true }
            );

            if (!updatedUser) {
                throw new Error("Failed to update wallet balance");
            }
            console.log("Wallet updated successfully:", updatedUser);
        }

        const order = new orderModel({
            userId: user._id,
            name: address.name,
            items: orderedItems,
            totalAmount: totalAmount,
            shippingAddress: address._id,
            paymentMethod: PaymentMethod,
            paymentStatus
        });

        await order.save();

        // Delete the cart
        await cartModel.findByIdAndDelete(cartId);

        res.render('user/orderPlaced', { user: true })
    } catch (e) {
        console.log(e);
        res.status(500).send("Erorr")
    }
}
