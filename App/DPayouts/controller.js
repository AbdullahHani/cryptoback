const PayoutModel = require('./model');

module.exports = {
  List: async (req, res) => {
    try {
        const id = req.decoded._id;
        let payouts = [];
        payouts = await PayoutModel.find({ user: id });
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
  }
}