const ProgramModel = require('./model');
const AdminModel = require('../Admin/model');
const AffiliationModel = require('../Affiliations/model');
const AffiliationReport = require('../AffiliationReport/model');
const UserModel = require('../Users/model');
const ConfigurationModel = require('../Configurations/model');

require('dotenv').config();

const request = require('request-promise');

module.exports = {
  List: async ( req, res ) => {
    try {
      const id = req.decoded._id;
      let programs = [];
      const isAdmin = await AdminModel.findOne({ _id: id }, { password: 0 });
      if (!isAdmin) {
        programs = await ProgramModel.find({user: id}).sort({_id: -1});
      }
      else {
        programs = await ProgramModel.find({}).sort({_id: -1});
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
      let output = null;
      const { hash } = req.body;
      if (hash) {
        const alreadyExist = await ProgramModel.findOne({ hash: hash });
        if (!alreadyExist) {
          const transaction = await request({
            url: `https://api.blockchair.com/bitcoin-cash/dashboards/transaction/${hash}`,
            method: 'GET',
            json: true
          });
          const data = transaction.data[hash];
          if (data) {
            const configuration = await ConfigurationModel.find({});
            const walletId = configuration[0].walletAddress;
            for (const out of data.outputs) {
              if (out.recipient === walletId) {
                output = out
              }
            }
            if (output) {
              const payedAmount = output.value / 100000000;
              const amountInDollar = output.value_usd;
              const investedMoney = amountInDollar - (amountInDollar * configuration[0].extra / 100);
              if (investedMoney >= 1) {
                const program = await ProgramModel.create({
                  user: req.decoded._id,
                  investment: investedMoney,
                  btc: payedAmount - ( payedAmount * configuration[0].extra / 100 ),
                  hash: hash
                });
                await UserModel.updateOne({_id: req.decoded._id}, {
                  status: 'Active'
                });
                const affiliations = await AffiliationModel.find({
                  user: req.decoded._id
                });
                for (const affiliation of affiliations) {
                  if (affiliation.referralId.status === 'Active') {
                    const commission = ( payedAmount - ( payedAmount * configuration[0].extra / 100 )) * (affiliation.commissionPercentage / 100);
                    const addCommission = commission + affiliation.amount;
                    const addBCH = (payedAmount - ( payedAmount * configuration[0].extra / 100 )) + affiliation.bch;
                    await AffiliationModel.updateOne({ _id: affiliation._id }, {
                      amount: addCommission,
                      bch: addBCH
                    });
                    await AffiliationReport.create({
                      amount: commission,
                      user: affiliation.user._id,
                      referralId: affiliation.referralId._id,
                      bch: payedAmount - ( payedAmount * configuration[0].extra / 100 ),
                      level: affiliation.level,
                      percent: affiliation.commissionPercentage,
                      program: program._id
                    });
                  }
                }
                return res.status(200).json({
                  status: "Successfull",
                  message: "Your Plan have been successfully started."
                });
              }
              else {
                return res.status(500).json({
                  status: "Failed",
                  message: "The amount you transferred is low to subscribe to our plan. Contact the support for manual activation."
                })
              }
            }
            else {
              return res.status(403).json({
                status: "Failed",
                message: "The transaction hash you provided is not valid. Verify that the hash provided is correct."
              });
            }
          } else {
            return res.status(403).json({
              status: "Failed",
              message: "The transaction hash you provided is not valid. Verify that the hash provided is correct."
            });
          }
        } else {
          return res.status(403).json({
            status: "Error",
            errHash: "Program already started"
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
  },
  ManualStart: async ( req, res ) => {
    try {
      const {
        userName,
        amountInDollar,
        amountInBCH,
        hash
      } = req.body;
      const alreadyExist = await ProgramModel.findOne({ hash: hash });
      if(alreadyExist) {
        return res.status(403).json({
          status: "Failed",
          message: "Program already started against this hash"
        });
      }
      const User = await UserModel.findOne({userName: userName.toLowerCase()}, { password: 0 });
      if (!User) {
        return res.status(403).json({
          status: "Failed",
          errUser: "User does not exists"
        });
      }
      if (amountInDollar >= 100) {
        const program = await ProgramModel.create({
          user: User._id,
          investment: amountInDollar,
          btc: amountInBCH,
          hash: hash
        });
        await UserModel.updateOne({_id: User._id}, {
          status: 'Active'
        });
        const affiliations = await AffiliationModel.find({
          user: User._id
        });
        for (const affiliation of affiliations) {
          if (affiliation.referralId.status === 'Active') {
            const commission = ( amountInBCH) * (affiliation.commissionPercentage / 100);
            const addCommission = commission + affiliation.amount;
            const addBCH = amountInBCH + affiliation.bch;
            await AffiliationModel.updateOne({ _id: affiliation._id }, {
              amount: addCommission,
              bch: addBCH
            });
            await AffiliationReport.create({
              amount: commission,
              user: affiliation.user._id,
              referralId: affiliation.referralId._id,
              bch: amountInBCH,
              level: affiliation.level,
              percent: affiliation.commissionPercentage,
              program: program._id
            });
          }
        }
        return res.status(200).json({
          status: "Successful",
          message: "Successfully started Program"
        });
      } else {
        return res.status(401).json({
          status: "Failed",
          errAmount: "Program can not start on lower than $100"
        });
      }
    } catch (error) {
      return res.status(500).json({
        status: "Error",
        message: error.message
      });
    }
  },
  updateActivation: async ( req, res ) => {
    try {
      const id = req.params.id;
      const program = await ProgramModel.findOne({_id: id});
      if (program) {
        if (program.active === 'Yes') {
          await ProgramModel.updateOne({ _id: id }, {
            payWeek: 'No',
            programEnds: 'Yes',
            active: 'No'
          });
          const runningPrograms = await ProgramModel.find({
            user: program.user._id,
            programEnds: 'No'
          });
          if (!runningPrograms) {
            await UserModel.updateOne({_id: program.user._id}, {
              status: 'Inactive'
            });
          }

          return res.status(200).json({
            status: "Successful",
            message: "Program Deactivated"
          });
        } else {
          await ProgramModel.updateOne({ _id: id }, {
            payWeek: 'Yes',
            programEnds: 'No',
            active: 'Yes'
          });
          if (program.user.status === 'Inactive') {
            await UserModel.updateOne({_id: program.user._id}, {
              status: 'Active'
            });
          }
          return res.status(200).json({
            status: "Successful",
            message: "Program Activated"
          });
        }
      } else {
        return res.status(403).json({
          status: "Failed",
          message: "No such Program"
        });
      }
    } catch (error) {
      return res.status(500).json({
        status: "Successful",
        message: error.message
      });
    }
  }
}