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
        let affiliations = [];
        const isAdmin = await AdminModel.findOne({ _id: id }, { password: 0 });
        if (!isAdmin) {
          affiliations = await AffiliationModel.find({
            referralId: id
          });   
        } else {
          affiliations = await AffiliationModel.find({});
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