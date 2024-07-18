const mongoose = require('mongoose');

const Products_schema = new mongoose.Schema({
    name: {
        type: String,
        required: true // Make name mandatory
    },
    description: {
        type: String,
        required: true // Make name mandatory
    },
    rating: {
        type: Number,
        required: true // Make name mandatory
    },
    rate: {
        type: Number,
        required: true // Make name mandatory
    },
    listing: {
        type: Boolean,
        default: true // Default value is true if not provided
    },
    category: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'category',
        required: true // Make name mandatory
    },
    images: {
        type: [String],
        minlength: 3,
        maxlength: 3,
        required: [true,"3 images are required"],   
     }
   })

const Product = new mongoose.model('product', Products_schema)

module.exports = Product
