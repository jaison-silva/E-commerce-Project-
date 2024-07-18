const mongoose = require('mongoose')

const user = mongoose.Schema({
    name: {type:String, required:true},
    email: { type: String, required: true, unique: true },
    password: { type: String },
    wallet : {type: Number, required:true},
    status: { type: Boolean, default: true },
    dateCreated: { type: Date, default: Date.now }
})

const data = mongoose.model('user',user)

module.exports = data