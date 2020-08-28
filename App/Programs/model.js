const mongoose = require('mongoose');
const PlanModel = require('../Plans/model');
const UserModel = require('../Users/model');

const planSubscription = require('../../Jobs/PlanSubscription');

const Schema = mongoose.Schema;

const programSchema = new Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Users'
    },
    plan: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Plans'
    },
    days: {
        type: Number,
        default: 0
    },
    totalDays: {
        type: Number
    },
    payWeek: {
        type: String,
        trim: true,
        enum: ['Yes', 'No'],
        default: 'No'
    },
    programEnds: {
        type: String,
        trim: true,
        enum: ['Yes', 'No'],
        default: 'No'
    },
    weeklyCommission: {
        type: Number,
        default: 0
    },
    investment: {
        type: Number,
        default: 0
    },
    btc: {
        type: Number,
        default: 0
    },
    totalCommission: {
        type: Number,
        default: 0
    },
    invoice: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Invoices'
    },
    workingCapital: {
        type: Number,
        default: 0
    },
    hash: {
        type: String,
        trim: true
    },
    active: {
        type: String,
        trim: true,
        enum: ['Yes', 'No'],
        default: 'Yes'
    },
}, {
    timestamps: true
});

programSchema.pre('save', async function (next) {
    let selectedPlan = '';
    if (this.investment >=1 && this.investment <= 999) {
        selectedPlan = 'Basic'
    }
    else if (this.investment >=1000 && this.investment <= 9999){
        selectedPlan = 'Advanced'
    }
    else if (this.investment >=10000 && this.investment <= 99999){
        selectedPlan = 'Feature'
    }
    const plan = await PlanModel.findOne({
        name: selectedPlan
    });
    this.workingCapital = this.btc + (this.btc * (plan.capitalBonus / 100));
    this.plan = plan._id;
    const user = await UserModel.findOne({_id: this.user}, {password: 0});
    planSubscription(user, plan, this.btc);
    next();
})

var autoPopulateReplies = function (next) {
    this.populate('plan');
    this.populate('user');
    next();
};

programSchema
    .pre('findOne', autoPopulateReplies)
    .pre('find', autoPopulateReplies)
    .pre('findAll', autoPopulateReplies)
    .pre('findMany', autoPopulateReplies)

module.exports = mongoose.model('Programs', programSchema);