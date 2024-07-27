const Category = require('../models/categoryModel')
const Product = require('../models/productModel')
const userModel = require('../models/userModel')
const orderModel = require('../models/orderModel')
const couponModel = require('../models/couponModel')
const joi = require('joi')
const adminModel = require('../models/adminModel')
const jwt = require('jsonwebtoken')
const multer = require('multer');


exports.adminLogin = (req, res) => {
    res.render('admin/adminLogin')
}

exports.dashBoard = async (req, res) => {
    try {
        if (req.cookies && req.cookies.adminJwtAuth) {
            const response = await orderModel.find()
            if (!response) {
                console.log("error getting order data")
            }
            const overallSales = response.length
            const overallAmount = response.reduce((acc, val) => {
                console.log("Accumulating totalAmount. Current acc:", acc, "Current val.totalAmount:", val.totalAmount);
                return acc + val.totalAmount;
            }, 0);
            res.render('admin/admin', { overallSales, overallAmount });
        }
    } catch (error) {

    }
}

exports.login = async (req, res) => {
    try {
        let { email, password } = req.body;
        console.log("Login triggered with:", email, password);

        // Find admin by email
        const admin = await adminModel.findOne({ email: email });
        console.log("Admin found:", admin);

        if (!admin) {
            console.log("Admin not found!")
            return res.redirect('/admin/adminLogin?msg=email');
        }

        // Check if admin exists and passwords match
        if (admin && password === admin.password) {       //// confused with admin === admin.password since admin is an object
            console.log("Admin verified!");

            // Create a JWT token
            const token = { email: email };
            const adminToken = jwt.sign(token, "secret_key", { expiresIn: '15m' });

            // Set the JWT as a cookie
            res.cookie('adminJwtAuth', adminToken, {
                httpOnly: true,
                maxAge: 4 * 60 * 60 * 1000 // 4 hours in milliseconds
            });

            // Redirect to admin dashboard
            res.redirect('/admin/?msg=success');
        } else {
            // Invalid credentials, re-render login page
            res.redirect('/admin/adminLogin?msg=invalid');
        }
    } catch (err) {
        console.log("Error during login:", err);
        res.status(500).send(err);
    }
};

exports.logout = (req, res) => {
    try {
        res.clearCookie("adminJwtAuth");
        res.redirect('/?msg=loggedout');
    } catch (e) {
        console.log(e);
        res.status(500).send("Error");
    }
}

exports.adminCategory = async (req, res) => {
    try {
        const data = await Category.find({})
        console.log(data);
        res.render('admin/adminCategory', { data })
    } catch (err) {
        console.log(err)
        res.status(500).send(err)
    }
}

exports.manageUsers = async (req, res) => {
    try {
        const data = await userModel.find({})
        // console.log(data);
        res.render('admin/manageUsers', { data })
    } catch (err) {
        console.log(err)
        res.status(500).send(err)
    }
}

exports.toggleUser = async (req, res) => {
    const userId = req.params.userId;
    console.log("Troggered!")

    try {
        // Find user by userId (replace this with your actual logic)
        const user = await userModel.findById(userId);
        console.log(user)

        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        // Toggle user status (example: invert the current status)
        user.status = !user.status;

        // Save updated user status
        await user.save();

        console.log(user.status)

        // Send response
        res.json({ message: 'User status updated successfully' });
    } catch (error) {
        console.error('Error toggling user status:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
}

exports.adminProducts = async (req, res) => {
    try {
        const data = await Product.find().populate('category')
        console.log(data);
        res.render('admin/adminProducts', { data })
    } catch (err) {
        console.log(err)
        res.status(500).send(err)
    }
}


exports.addcategory = (req, res) => {
    res.render('admin/addCategory')
}

exports.addproducts = async (req, res) => {
    try {
        const data = await Category.find({}).select('name');
        console.log(data)
        res.render('admin/addproducts', { data })
    } catch (err) {
        console.log(err)
        res.status(500).send(err)
    }
}

const upload = multer({
    limits: {
        fileSize: 10 * 1024 * 1024, // 10MB limit per file
    },
    fileFilter: (req, file, cb) => {
        if (file.mimetype.startsWith("image/")) {
            cb(null, true);
        } else {
            cb(new Error("Only images are allowed"));
        }
    },
});

exports.addProducts = (req, res) => {
    try {
        let { name, description, rating, rate, category } = req.body;
        console.log(req.files);
        const imagesArray = req.files.map(file => file.path);  // Assuming you're storing file paths

        if (imagesArray.length !== 3) {
            return res.status(400).send({ message: "Exactly 3 images are required" });
        }

        const data = new Product({ name, description, rating, rate, category, images: imagesArray });

        data.save()
            .then(() => {
                console.log("product added");
                res.redirect("/admin/products?msg=added");
            })
            .catch((err) => {
                console.log("failed to add product ", err);
                res.send("failed to add product");
            });
    } catch (err) {
        console.log(err);
        res.status(500).send(err);
    }
};


exports.renderEdit = async (req, res) => {
    try {
        const productId = req.params.id
        const data = await Product.findById(productId).populate('category');
        const categories = await Category.find({ listing: true });
        res.render('admin/editProducts', { data, categories })
    } catch (err) {
        console.log(err)
        res.status(500).send(err)
    }
}

exports.updateProduct = async (req, res) => {
    try {
        const token = req.cookies.adminJwtAuth;
        const decoded = jwt.verify(token, 'secret_key'); // Use the same secret key used to sign the token
        console.log(decoded.email + " this is the decoded ");

        if (!decoded) {
            return res.status(400).send('User not found');
        }

        console.log("Triggered!")
        console.log(req.body.name, req.body.id);
        const { id, name, descriptions, rating, rate, category } = req.body;

        const response = await Product.findByIdAndUpdate(id, { name, descriptions, rating, rate, category }, { new: true })

        if (!response) {
            console.log("not updated")
            res.status(500).json({ message: " not updated" })
        } else {
            res.redirect('/admin/products')
        }

    } catch (e) {
        console.log(e);
        res.status(500).send("Error happened!!")
    }
}

exports.updateCategory = async (req, res) => {
    const { id, name, description, rate } = req.body;

    const data = await Category.findByIdAndUpdate(id, {
        name,
        description,
        rate
    });

    res.json({ message: 'added' }); // Return a JSON response
};


exports.addCategory = (req, res) => {
    try {
        let { name, description, rate } = req.body

        const data = Category({
            name,
            description,
            rate
        })

        data.save()
            .then(() => {
                console.log("data saved to db");
                res.redirect('/admin/category?msg=added');
            })
            .catch((err) => {
                console.log("data not saved to db", err)
                res.send(err)
            })
    } catch (err) {
        console.log(err)
        res.status(500).send(err)
    }
}

exports.editCategory = async (req, res) => {
    try {

        const id = req.params.id

        const model = await Category.findById(id)

        return res.render('admin/editCategory', model)
    } catch (err) {
        console.log(err)
        res.status(500).send(err)
    }
}

exports.deleteProduct = async (req, res) => {
    try {
        const productId = req.params.id;

        // Check if the product exists
        const product = await Product.findById(productId);
        if (!product) {
            return res.status(404).json({ message: "Product not found" });
        }

        await Product.findByIdAndDelete(productId);
        return res.status(200).json({ message: "Deletion successful" });
    } catch (e) {
        console.error(e);
        return res.status(500).json({ message: "An error occurred while deleting the product" });
    }
}

exports.deleteCategory = async (req, res) => {
    try {
        const categoryId = req.params.id;
        console.log("Triggered!", categoryId);

        // Check if the product exists
        const category = await Category.findById(categoryId);
        if (!category) {
            return res.status(404).json({ message: "Product not found" });
        }

        // Find and delete all products associated with this category
        await Product.deleteMany({ category: categoryId });

        // Delete the category
        await Category.findByIdAndDelete(categoryId);

        return res.status(200).json({ message: "Deletion successful" });
    } catch (e) {
        console.error(e);
        return res.status(500).json({ message: "An error occurred while deleting the product" });
    }
}

exports.manageOrders = async (req, res) => {
    try {
        const data = await orderModel.find({});
        console.log(data)

        res.render('admin/manageOrders', { data })
    } catch (e) {
        console.log(e);
        res.status(500).send(e)
    }
}

exports.deliverOrder = async (req, res) => {
    try {
        console.log("triggered")
        const id = req.params.id

        const response = await orderModel.findByIdAndUpdate(id, {
            status: "Delivered",
            paymentStatus: "Completed"
        }, { new: true })

        if (response) {
            res.json({ message: "Success" })
        }

    } catch (e) {
        console.log("error" + e)
        res.status(500).json({ message: "fail" })
    }
}

exports.offers = async (req, res) => {

    const productOffers = await Product.find({ offerApplied: true })
    const categoryData = await Category.find()
    const productData = await Product.find().populate('category')

    res.render('admin/offers', { productData, categoryData, productOffers })
}

exports.updateOffers = async (req, res) => {
    const { offerType, elementId, discount } = req.body
    // console.log(offerType, elementId, discount)

    if (offerType == 'products') {

        const data = await Product.findById(elementId)
        // console.log(data + " this is the data")
        const currentRate = data.rate
        const newRate = currentRate * (discount / 100)

        await Product.findByIdAndUpdate(elementId, {
            offerApplied: true,
            rateTemp: currentRate,
            rate: newRate,
            offerPercentage: discount
        }).then((offerAppliedToProduct) => {
            console.log(offerAppliedToProduct)
            return res.json({ msg: "success" })
        })

    } else {
        const allProducts = await Product.find({ category: elementId })

        if (!allProducts) {
            return res.json({ msg: "No products in this category" })
        }

        const offerAppliedToCategory = allProducts.map(async (product) => {
            const data = await Product.findById(product._id)
            // console.log(data + " this is the data")
            const currentRate = data.rate
            const newRate = currentRate * (discount / 100)

            return await Product.findByIdAndUpdate(product._id, {
                offerApplied: true,
                rateTemp: currentRate,
                rate: newRate,
                offerPercentage: discount
            })
        })

        await Promise.all(offerAppliedToCategory)
            .then(() => {
                return res.json({ msg: "Offer applied to all products in the category successfully" });
            })
    }
}

exports.deleteOffer = async (req, res) => {
    const id = req.params.id
    const data = await Product.findById(id)

    await Product.findByIdAndUpdate(id, {
        rate: data.rateTemp,
        rateTemp: 0,
        offerApplied: false,
        offerPercentage: 0
    })
        .then(() => {
            return res.redirect('/admin/offers?msg=success')
        })
}

exports.coupon = async (req, res) => {
    const coupon = await couponModel.find()
    let data =  coupon.map( async (element) => {
        if(element.isExpired()){
            element.isActive = "Expired"
            await element.save()
        }
        return element
    });

    data = await Promise.all(data)

    res.render('admin/coupon', { coupon : data })
}

exports.addCoupon = async (req, res) => {
    
    console.log(req.body)

    const schema = joi.object({
        code: joi.string().alphanum().min(3).max(30).required(),
        discountPercentage: joi.number().min(0).max(100).required(),
        minimumPurchaseAmount: joi.number().min(0).required(),
        expiryDate: joi.date().iso().greater('now').required()
    });

    const {error , value } = schema.validate(req.body)
    if (error) {
        console.log('Validation error:', error.details);
        return res.status(400).json({ error: error.details[0].message });
    }
    const { code, discountPercentage, minimumPurchaseAmount, expiryDate } = value

    const date = new couponModel({
        code,
        discountPercentage,
        minimumPurchaseAmount,
        expiryDate
    })

    try {
        await date.save();
        console.log('Coupon created successfully');
        res.status(200)
    } catch (error) {
        console.log('Error creating coupon:', error);
    }
}