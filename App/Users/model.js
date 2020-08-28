const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const Schema = mongoose.Schema;

const RegistrationEmail = require('../../Jobs/Registration');

const UserSchema = new Schema({
    name: {
        type: String,
        required: true,
        trim: true
    },
    userName: {
        type: String,
        trim: true,
        unique: true,
        required: true
    },
    email: {
        type: String,
        required: true,
        unique: true,
        trim: true
    },
    password: {
        type: String,
        trim: true,
    },
    token: {
        type: String,
        trim: true
    },
    verificationCode: {
        type: String,
        trim: true
    },
    city: {
        type: String,
        trim: true
    },
    country: {
        type: String,
        trim: true
    },
    telegram: {
        type: String,
        trim: true
    },
    phoneNumber: {
        type: String,
        trim: true
    },
    walletId: {
        type: String,
        trim: true
    },
    changePasswordCode: {
        type: String,
        trim: true
    },
    changeWalletCode: {
        type: String,
        trim: true
    },
    levelOne: [{
        type: String,
        trim: true
    }],
    levelTwo: [{
        type: String,
        trim: true
    }],
    levelThree: [{
        type: String,
        trim: true
    }],
    status: {
        type: String,
        trim: true,
        enum: ['Active', 'Inactive', 'Blocked'],
        default: 'Inactive'
    },
    balance: {
        type: Number,
        default: 0
    },
    totalPayouts: {
        type: Number,
        default: 0
    },
    affiliationBonus: {
        type: Number,
        default: 0
    },
    verified: {
        type: String,
        trim: true,
        enum: ['Yes', 'No'],
        default: 'No'
    },
    block: {
        type: String,
        trim: true,
        enum: ['Yes', 'No'],
        default: 'No'
    }
},{timestamps: true});

// var autoPopulateReplies = function (next) {
//     this.populate('test');
//     next();
// };

// AgentSchema
//     .pre('findOne', autoPopulateReplies)
//     .pre('find', autoPopulateReplies)
//     .pre('findAll', autoPopulateReplies)
//     .pre('findMany', autoPopulateReplies)

UserSchema.pre('save', function ( next ) {
    this.password = bcrypt.hashSync(this.password, 10);
    next();
});

UserSchema.post('save', async function () {
    RegistrationEmail(this);
});

UserSchema.methods.comparePassword = function (candidatePassword) {
    return bcrypt.compare(candidatePassword, this.password);
}

module.exports = mongoose.model('Users', UserSchema);