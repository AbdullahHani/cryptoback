const PayoutModel = require('./model');
const AdminModel = require('../Admin/model');
const ProgramModel = require('../Programs/model');

module.exports = {
  List: async (req, res) => {
    try {
        const id = req.decoded._id;
        let payouts = [];
        const isAdmin = await AdminModel.findOne({ _id: id }, { password: 0 });
        if (!isAdmin) { 
          payouts = await PayoutModel.find({ user: id });  
        } else {
          payouts = await PayoutModel.find({});
        }
        return res.status(200).json({
            status: "Successful",
            data: payouts
        });
    } catch (error) {
        return res.status(500).json({
            status: "Error",
            message: error.message
        });
    }
  },
  GraphData: async ( req, res ) => {
    try {
      const id = req.decoded._id;
      const graphData = [];
      const programs = await ProgramModel.find({
        user: id,
        programEnds: 'No'
      });
      for (const program of programs) {
        const payouts = await PayoutModel.find({program: program._id});
        const obj = {
          program: program,
          payouts: payouts
        }
        graphData.push(obj);
      }
      return res.status(200).json({
        status: "Successful",
        data: graphData
      });
    } catch (error) {
      return res.status(500).json({
        status: "Error",
        message: error.message
      });
    }
  }
}