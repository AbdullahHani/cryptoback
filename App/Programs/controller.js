const ProgramModel = require('./model');
const AdminModel = require('../Admin/model');
const AffiliationModel = require('../Affiliations/model');
const AffiliationReport = require('../AffiliationReport/model');
const UserModel = require('../Users/model');

const BlockchainExc = require('blockchain.info/exchange');
const Receive = require('blockchain.info/Receive');

require('dotenv').config();

const request = require('request-promise');

module.exports = {
  List: async ( req, res ) => {
    try {
      const id = req.decoded._id;
      let programs = [];
      const isAdmin = await AdminModel.findOne({ _id: id }, { password: 0 });
      if (!isAdmin) {
        programs = await ProgramModel.find({user: id});
      }
      else {
        programs = await ProgramModel.find({});
      }
      return res.status(200).json({
          status: "Successfull",
          data: programs
      })
    } catch (error) {
      return res.status(500).json({
          status: "Error",
          message: error.message
      });
    }
  },
  View: async ( req, res ) => {
    try {
      const id = req.decoded._id;
      const programs = await ProgramModel.find({
          user: id
      });
      return res.status(200).json({
          status: "Successfull",
          data: programs
      })
    } catch (error) {
      return res.status(500).json({
          status: "Error",
          message: error.message
      });
    }
  },
  Create: async (req, res) => {
    try {
      const { hash } = req.body;
      if (hash) {
        const transaction = await request({
          url: `https://api.blockchair.com/bitcoin-cash/dashboards/transaction/${hash}`,
          method: 'GET',
          json: true
        });
        const data = transaction.data[hash];
        if (data) {
          const payedAmount = data.outputs[1].value / 10000000;
          const amountInDollar = data.outputs[1].value_usd;
          const investedMoney = amountInDollar - (amountInDollar * 0.03);
          await ProgramModel.create({
            user: req.decoded._id,
            investment: investedMoney,
            btc: payedAmount,
            hash: hash
          });
          await UserModel.updateOne({_id: req.decoded._id}, {
            status: 'Active'
          });
          const affiliations = await AffiliationModel.find({
            user: req.decoded._id
          });
          for (const affiliation of affiliations) {
            const commission = ( payedAmount - ( payedAmount * 0.03 )) * (affiliation.commissionPercentage / 100);
            const user = await UserModel.findOne({ _id: affiliation.referralId },{ password: 0 });
            const balance = user.balance + commission;
            const affBonus = user.affiliationBonus + commission;
            await UserModel.updateOne({ _id: user._id }, {
              balance: balance,
              affiliationBonus: affBonus
            });
            await AffiliationReport.create({
              referralId: user._id,
              user: req.decoded._id,
              level: affiliation.level,
              percent: affiliation.commissionPercentage,
              amount: commission
            });
          }
          return res.status(200).json({
            status: "Successfull",
            message: "Your Plan have been successfully started."
          });
        } else {
          return res.status(403).json({
            status: "Failed",
            message: "The transaction hash you provided is not valid. Verify that the hash provided is correct."
          });
        }
      } else {
        return res.status(403).json({
          status: "Error",
          errHash: "Provide Transaction Hash"
        });
      }
    } catch (error) {
      if (error.statusCode === 404) {
        return res.status(500).json({
          status: "Error",
          message: "Wrong transaction hash entered"
        });
      }
      return res.status(500).json({
        status: "Error",
        message: error.message
      });
    }
  }
}