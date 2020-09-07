const mongoose = require('mongoose');

const Schema = mongoose.Schema;

const AffiliationReportsSchema = new Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Users'
    },
    amount: {
        type: Number
    },
    level: {
        type: Number
    },
    percent: {
        type: Number
    },
    referralId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Users'
    },
    bch: {
        type: Number,
        default: 0
    },
    program: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Programs'
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
    this.populate('user');
    this.populate('referralId');
    this.populate('program');
    next();
};

AffiliationReportsSchema
    .pre('findOne', autoPopulateReplies)
    .pre('find', autoPopulateReplies)
    .pre('findAll', autoPopulateReplies)
    .pre('findMany', autoPopulateReplies)

module.exports = mongoose.model('AffReports', AffiliationReportsSchema);