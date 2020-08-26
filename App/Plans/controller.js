const planModel = require('./model');
const jwt = require('jsonwebtoken');
const environment = require('dotenv');

environment.config();

module.exports = {
  Create: async (req, res) => {
    try {
        let { name } = req.body;
        const exists = await planModel.find({name: name}).countDocuments();
        if (exists > 0) {
            return res.status(409).json({
                status: "Failed",
                message: "This Plan has already been created"
            });
        }
        const plan = await planModel.create(req.body);
        return res.status(200).json({
            status: "Successful!",
            message: "Successfully Registered plan",
            data: plan
        });
    } catch (error) {
        return res.status(500).json({
            status: "Error",
            message: error.message
        });
    }
  },
  Remove: async (req, res) => {
    try {
        const id = req.params.id;
        const removeplan = await planModel.remove({_id: id});
        if ( removeplan.ok === 1 ) {
            return res.status(200).json({
                status: "Successful!",
                message: "Successfully Deleted plan"
            });
        }
        else {
            throw new Error("Could not delete. Try Again");
        }
    } catch (error) {
        return res.status(500).json({
            status: "Error",
            message: error.message
        });
    }
  },
  Update: async (req, res) => {
    try {
        let id = req.params.id;
            const plan = await planModel.updateOne({_id: id}, {
                $set: req.body
            });
            return res.status(200).json({
                status: "Successful",
                message: "Successfully Updated",
                data: plan
            });
    } catch (error) {
        return res.status(500).json({
            status: "Error",
            message: error.message
        });
    }
  }
}