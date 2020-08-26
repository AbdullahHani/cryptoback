const adminModel = require('./model');
const jwt = require('jsonwebtoken');
const environment = require('dotenv');

environment.config();

const sgMail = require('@sendgrid/mail');
sgMail.setApiKey(process.env.SENDGRID_API_KEY);

module.exports = {
  Create: async (req, res) => {
    try {
        let { name, email, password } = req.body;
        let token = "";
        const alreadyExist = await adminModel.findOne({ email: email }).count();
        if ( alreadyExist ) {
            return res.status(409).json({
                status: "Error",
                errEmail: "Email already Taken"
            });
        }
        const admin = await adminModel.create({
            name: name,
            email: email,
            password: password
        });
        token = jwt.sign({ _id: admin.id.toString() },
            process.env.TOKEN_SECRET,
            { expiresIn: "7 days" }
        );
        await adminModel.updateOne({_id: admin.id}, {
            token: token
        });
        return res.status(200).json({
            status: "Successful!",
            message: "Successfully Registered Admin"
        });
    } catch (error) {
        return res.status(500).json({
            status: "Error",
            message: error.message
        });
    }
  },
  Login: async (req, res) => {
    try {
        let { email, password } = req.body;
        let token = "";
        const admin = await adminModel.findOne({email: email});
        if ( !admin ) {
            return res.status(409).json({
                status: "Error",
                errEmail: "Email does not exist"
            });
        }
        else {
            let isMatch = await admin.comparePassword(password);
            if ( !isMatch ) {
                return res.status(409).json({
                    status: "Error",
                    errPassword: "Incorrect Password"
                });
            }
            else {
                token = jwt.sign({ _id: admin.id.toString() },
                    process.env.TOKEN_SECRET,
                    { expiresIn: "7 days" }
                );
                await adminModel.updateOne({_id: admin.id}, {
                    token: token
                });
                admin.token = token;
                admin.password = undefined;
                return res.status(200).json({
                    status: "Successful",
                    message: "Successfully Logged In",
                    data: admin
                });
            }
        }
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
        const removeAdmin = await adminModel.remove({_id: id});
        if ( removeAdmin.ok === 1 ) {
            return res.status(200).json({
                status: "Successful!",
                message: "Successfully Deleted Admin"
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
  View: async ( req, res ) => {
    try {
        let id = req.params.id;
        const user = await adminModel.findOne({_id: id}, {password: 0});
        if ( !user ) {
            return res.status(403).json({
                status: "Failed",
                message: "Can not retrieve user Detail. Try Again!"
            });
        }
        else {
            return res.status(200).json({
                status: "Successfull",
                data: user
            });
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
        let { name, email } = req.body;
        let id = req.params.id;
        const alreadyExist = await adminModel.findOne({
            _id: id,
            email: {$ne: email}
        }).count();
        if ( !alreadyExist ) {
            return res.status(409).json({
                status: "Error",
                errEmail: "Email already Taken"
            });
        }
        else {
            const admin = await adminModel.updateOne({_id: id}, {
                name: name,
                email: email
            });
            return res.status(200).json({
                status: "Successful",
                message: "Successfully Updated",
                data: admin
            });
        }
    } catch (error) {
        return res.status(500).json({
            status: "Error",
            message: error.message
        });
    }
  },
  EmailUs: async (req, res) => {
    try {
        const data = req.body;
        const msg = {
            to: process.env.RECEIVER_EMAIL,
            from: data.email,
            subject: data.subject,
            text: data.message,
            html: data.message
        };
        await sgMail.send(msg);
        return res.status(200).json({
            status: "Email Sent",
            message: "Your email have been sent to our support. We will reply you within 24 hours"
        });
    } catch (error) {
        return res.status(500).json({
            status: "Failed",
            message: error.message
        });
    }
  }
}