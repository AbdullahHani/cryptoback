const InvoiceModel = require('./model');
const ProgramModel = require('../Programs/model');
const AffiliationModel = require('../Affiliations/model');
const AffiliationReport = require('../AffiliationReport/model');
const UserModel = require('../Users/model');

const BlockchainExc = require('blockchain.info/exchange');

const lowPaymentEmail = require('../../Jobs/LowPaymentEmail');

module.exports = {
  Webhook: async ( req, res ) => {
    try {
      const hash = req.query.transaction_hash;
      const payment = req.query.value;
      const id = req.query.invoice;

      const invoice = await InvoiceModel.findOne({_id: id});
      if (invoice) {
        if (!invoice.hash){
          const payedAmount = parseInt(payment) / 100000000;
          const amountInDollar = await BlockchainExc.fromBTC(parseInt(payment), 'USD');
          const investedMoney = amountInDollar - invoice.extra;
          if (payedAmount >= invoice.btc) {
            await ProgramModel.create({
              user: invoice.user._id,
              investment: investedMoney,
              btc: payedAmount,
              invoice: id
            });
            await UserModel.updateOne({_id: invoice.user._id}, {
              status: 'Active'
            });
            const affiliations = await AffiliationModel.find({
              user: invoice.user._id
            });
            for (const affiliation of affiliations) {
              const commission = await BlockchainExc.toBTC((investedMoney * affiliation.commissionPercentage / 100), 'USD');
              const user = await UserModel.findOne({ _id: affiliation.referralId },{ password: 0 });
              const balance = user.balance + commission;
              const affBonus = user.affiliationBonus + commission;
              await UserModel.updateOne({ _id: user._id }, {
                balance: balance,
                affiliationBonus: affBonus
              });
              await AffiliationReport.create({
                referralId: user._id,
                user: invoice.user._id,
                level: affiliation.level,
                percent: affiliation.commissionPercentage,
                amount: commission
              });
            }
            InvoiceModel.updateOne({_id: id}, {
              hash: hash
            });
          } else {
            lowPaymentEmail(invoice.user)
          }
        }
      }
        res.status(200).send('*ok*');
    } catch (error) {
        res.send(404);
    }
  }
}