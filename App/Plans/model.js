const mongoose = require('mongoose');

const Schema = mongoose.Schema;

const PlanSchema = new Schema({
    name: {
        type: String,
        required: true,
        trim: true
    },
    minInvestment: {
        type: Number
    },
    maxInvestment: {
        type: Number
    },
    capitalBonus: {
        type: Number
    },
    dailyCommission: {
        type: Number
    },
    weeklyCommission: {
        type: Number
    },
    weeks: {
        type: Number
    }
}, {timestamps: true});

module.exports = mongoose.model('Plans', PlanSchema);