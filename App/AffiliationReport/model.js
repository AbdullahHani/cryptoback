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
    btc: {
        type: Number,
        default: 0
    }
}, {
    timestamps: true
});

var autoPopulateReplies = function (next) {
    this.populate('user');
    this.populate('referralId');
    next();
};

AffiliationReportsSchema
    .pre('findOne', autoPopulateReplies)
    .pre('find', autoPopulateReplies)
    .pre('findAll', autoPopulateReplies)
    .pre('findMany', autoPopulateReplies)

module.exports = mongoose.model('AffReports', AffiliationReportsSchema);