const AffiliationModel = require('./model');
const AdminModel = require('../Admin/model');
const UsersModel = require('../Users/model');

const environment = require('dotenv');
environment.config();

const sgMail = require('@sendgrid/mail');
sgMail.setApiKey(process.env.SENDGRID_API_KEY);

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
          const affiliationData = await AffiliationModel.findOne({_id: affiliation._id});
          if (affiliation.status === 'Paid' && affiliationData.status === 'Unpaid') {
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
            let message = '';
            message= '<img src="https://s12.directupload.net/images/200827/6xtdhlvh.png" style="height:60px;"/><br>' +
                        '<h2 style="font-weight: 700; text-decoration: underline; text-align:center">Affiliation Bonus Transferred</h2><br>';
            message += `<h3><b>Dear ${user.name}!</b></h3><br>` +
                        `<p>We transferred ${affiliationNew.amount.toFixed(4)} BTC to your wallet as an affiliation bonus. The transaction hash of the transferred amount is: ${affiliation.txid}. </p>` +
                        '<br><p><b>Regards:</b></p><br><p>Odeffe</p>';
            message += '<div style="display: flex; justify-content: flex-start;">' + 
                        '<a href="https://twitter.com/OdeffeOfficial" target="_blank"><img src="https://s12.directupload.net/images/200827/9ow4ycu5.png" height="50"/></a>' +
                        '<a href="https://www.facebook.com/OdeffeOfficial/" target="_blank"><img src="https://s12.directupload.net/images/200827/iip65qfr.png" height="50"/></a>' +
                        '<a href="https://www.instagram.com/odeffeofficial/" target="_blank"><img src="https://s12.directupload.net/images/200827/edl3bq6h.png" height="50"/></a>' +
                        '<a href="https://t.me/OdeffeOfficial" target="_blank"><img src="https://s12.directupload.net/images/200827/vf2frr6w.png" height="50"/></a>' +
                        '<a href="https://www.youtube.com/channel/UCYToRqJmUI_NnNtMWzWjJHQ?view_as=subscriber" target="_blank"><img src="https://s12.directupload.net/images/200827/h2mwptv7.png" height="50"/></a>' +
                        '</div>';
            const msg = {
                to: user.email,
                from: process.env.SENDER_EMAIL,
                subject: `Odeffe: Affiliation Bonus`,
                text: message,
                html: message
            };
            await sgMail.send(msg);
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