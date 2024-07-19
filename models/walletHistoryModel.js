const mongoose = require('mongoose')

const history = mongoose.Schema({
    userId: { type: mongoose.Schema.ObjectId },
    history: [{
        amount: { type: Number, required: true },
        type: { type: String, enum: ['debit', 'credit'], required: true },
        dateCreated: { type: Date, default: Date.now }
    }],
})

const data = mongoose.model('walletHistory', history)

module.exports = data