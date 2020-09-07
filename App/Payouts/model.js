const mongoose = require('mongoose');

const Schema = mongoose.Schema;

const PayoutSchema = new Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Users'
    },
    amount: {
        type: Number
    },
    plan: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Plans'
    },
    btc: {
        type: Number
    },
    program: {
        type: String,
        trim: true
    },
    hash: {
        type: String,
        trim: true
    },
    status: {
        type: String,
        trim: true,
        enum: ['Paid', 'Unpaid'],
        default: 'Unpaid'
    },
    txid: {
        type: String,
        trim: true
    }
}, {
    timestamps: true
});

var autoPopulateReplies = function (next) {
    this.populate('plan');
    this.populate('user');
    next();
};

PayoutSchema
    .pre('findOne', autoPopulateReplies)
    .pre('find', autoPopulateReplies)
    .pre('findAll', autoPopulateReplies)
    .pre('findMany', autoPopulateReplies)

module.exports = mongoose.model('WeeklyPayouts', PayoutSchema);