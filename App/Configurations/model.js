const mongoose = require('mongoose');

const Schema = mongoose.Schema;


const ConfigurartionSchema = new Schema({
    extra: {
        type: Number
    },
    walletAddress: {
        type: String,
        trim: true
    }
}, {
    timestamps: true
});

module.exports = mongoose.model('Configurations', ConfigurartionSchema);