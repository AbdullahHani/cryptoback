const mongoose = require('mongoose');

const Schema = mongoose.Schema;

const affiliationSchema = new Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Users'
    },
    referralId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Users'
    },
    level: {
        type: Number,
        enum: [1, 2, 3]
    },
    commissionPercentage: {
        type: Number,
        enum: [1, 3, 7]
    },
    commission: {
        type: Number
    }
}, {
    timestamps: true
});

var autoPopulateReplies = function (next) {
    this.populate('user');
    this.populate('referralId')
    next();
};

affiliationSchema
    .pre('findOne', autoPopulateReplies)
    .pre('find', autoPopulateReplies)
    .pre('findAll', autoPopulateReplies)
    .pre('findMany', autoPopulateReplies)

module.exports = mongoose.model('Affiliations', affiliationSchema);