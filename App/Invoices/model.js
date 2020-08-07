const mongoose = require('mongoose');

const Schema = mongoose.Schema;


const InvoiceSchema = new Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Users'
    },
    amount: {
        type: Number
    },
    btc: {
        type: Number
    },
    address: {
        type: String,
        trim: true
    },
    extra: {
        type: Number
    },
    hash: {
        type: String,
        trim: true
    },
    payment: {
        type: Number,
        default: 0
    },
    paymentLink: {
        type: String,
        trim: true
    }
}, {
    timestamps: true
});

var autoPopulateReplies = function (next) {
    this.populate('user');
    next();
};

InvoiceSchema
    .pre('findOne', autoPopulateReplies)
    .pre('find', autoPopulateReplies)
    .pre('findAll', autoPopulateReplies)
    .pre('findMany', autoPopulateReplies)

module.exports = mongoose.model('Invoices', InvoiceSchema);