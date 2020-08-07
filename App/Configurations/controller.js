const ConfigurationModel = require('./model');

module.exports = {
  Create: async ( req, res ) => {
    try {
        const configuration = await ConfigurationModel.create(req.body);
        return res.status(200).json({
            status: "Successful",
            data: configuration
        })
    } catch (error) {
        return res.status(500).json({
            status: "Error",
            message: error.message
        });
    }
  },
  Update: async ( req, res ) => {
    try {
        const id = req.params.id;
        await ConfigurationModel.updateOne({ _id: id }, {
            $set: req.body
        });
        const configuration = await ConfigurationModel.find({});
        return res.status(200).json({
            status: "Successful",
            message: "Successfully updated configurations",
            data: configuration[0]
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
        const configuration = await ConfigurationModel.find({});
        return res.status(200).json({
            status: "Successful",
            data: configuration[0]
        })
    } catch (error) {
        return res.status(500).json({
            status: "Error",
            message: error.message
        });
    }
  }
}