const AffiliationModel = require('../Affiliations/model');
const AdminModel = require('../Admin/model');

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
        const status = req.query.status;
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
    }
}