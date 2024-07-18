const mongoose = require('mongoose')

const schema = mongoose.Schema({
    username: String,
    email: String,
    password: String
})

const adminModel = mongoose.model('admin',schema);

module.exports = adminModel