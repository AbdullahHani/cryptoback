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
        let type = req.query.type;
        let status = req.query.status;
        if (status === 'undefined') {
          status = ''
        }
        let affiliations = [];
        const isAdmin = await AdminModel.findOne({ _id: id }, { password: 0 });
        if (!isAdmin) {
          if ( type === 'All' ) {
            affiliations = await AffiliationModel.find({
              referralId: id
            }).sort({_id: -1});   
          } else {
            type = parseInt(type);
            affiliations = await AffiliationModel.find({
              referralId: id,
              level: type
            }).sort({_id: -1});
          }
        } else {
          if ( type === 'All' ) {
            if (!status) {
              affiliations = await AffiliationModel.find({}).sort({_id: -1});   
            } else {
              affiliations = await AffiliationModel.find({
                status: status
              }).sort({_id: -1});
            }
          } else {
            type = parseInt(type);
            if (!status) {
              affiliations = await AffiliationModel.find({
                level: type
              }).sort({_id: -1});
            } else {
              affiliations = await AffiliationModel.find({
                level: type,
                status: status
              }).sort({_id: -1});
            }
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
        const { affiliations } = req.body;
        for (const affiliation of affiliations) {
          if (affiliation.status === 'Paid') {
            await AffiliationModel.updateOne({_id: affiliation._id}, {
              status: 'Paid',
              txid: affiliation.txid
            });
            const affiliationNew = await AffiliationModel.findOne({_id: affiliation._id});
            const user = await UsersModel.findOne({userName: affiliation.user});
            const balance = user.balance + affiliationNew.amount;
            const totalPayouts = user.totalPayouts + affiliationNew.amount;
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