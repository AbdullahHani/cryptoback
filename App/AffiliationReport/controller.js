const AffiliationModel = require('./model');
const AdminModel = require('../Admin/model');
const UsersModel = require('../Users/model');

module.exports = {
    View: async ( req, res ) => {
      try {
        const id = req.decoded._id;
        const isAdmin = await AdminModel.findOne({ _id: id }, { password: 0 });
        if (!isAdmin) {
            return res.status(404).json({
                status: "Failed",
                message: "Not Authorized"
            });
        }
        const affiliations = await AffiliationModel.find({});
        return res.status(200).json({
            status: "Successfull",
            data: affiliations
        })
      } catch (error) {
        return res.status(500).json({
            status: "Error",
            message: error.message
        });
      }
    },
    List: async ( req, res ) => {
      try {
        const id = req.decoded._id;
        const type = req.query.type;
        let affiliations = [];
        const isAdmin = await AdminModel.findOne({ _id: id }, { password: 0 });
        if (!isAdmin) {
          if ( type === 'All' ) {
            affiliations = await AffiliationModel.find({
              referralId: id
            });   
          } else {
            type = parseInt(type);
            affiliations = await AffiliationModel.find({
              referralId: id,
              level: type
            });
          }
        } else {
          if ( type === 'All' ) {
            affiliations = await AffiliationModel.find({});   
          } else {
            type = parseInt(type);
            affiliations = await AffiliationModel.find({
              level: type
            });
          }
        }
        return res.status(200).json({
            status: "Successfull",
            data: affiliations
        })
      } catch (error) {
        return res.status(500).json({
            status: "Error",
            message: error.message
        });
      }
    },
    BulkUpdate: async (req, res) =>{
      try {
        const { payouts } = req.body;
        for (const payout of payouts) {
          if (status === 'Paid') {
            await PayoutModel.updateOne({_id: payout._id}, {
              status: 'Paid'
            });
            const payoutNew = await PayoutModel.findOne({_id: payout._id});
            const user = await UsersModel.findOne({userName: payout.userName});
            const balance = user.balance + payoutNew.amount;
            const totalPayouts = user.totalPayouts + payoutNew.amount;
            await UsersModel.updateOne({_id: user._id}, {
              balance: balance,
              totalPayouts: totalPayouts
            });
          }
        }
        return res.status(200).json({
          status: "Successful",
          message: "Successfully Updated Payout Status"
        });
      } catch (error) {
        return res.status(500).json({
          status: "Error",
          message: error.message
        });
      }
    }
}