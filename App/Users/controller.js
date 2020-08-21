const UsersModel = require('./model');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const environment = require('dotenv');
const moment = require('moment');

const AffiliationModel = require('../Affiliations/model');
const ProgramModel = require('../Programs/model');
const PayoutsModel = require('../Payouts/model');

const changePasswordJob = require('../../Jobs/ChangePassword');
const changeWalletJob = require('../../Jobs/WalletOTP');

environment.config();

module.exports = {
  Create: async (req, res) => {
    try {
        let {
            name,
            userName,
            email,
            password,
            referralLink
        } = req.body;
        let token = "", user = {};
        let existingAccount = await UsersModel.findOne({email: email}).count();
        if ( existingAccount > 0) {
            return res.status(409).json({
                status: "Error",
                errorEmail: "Email already taken."
            });
        }
        existingAccount = await UsersModel.findOne({userName: userName}).count();

        if ( existingAccount > 0) {
            return res.status(409).json({
                status: "Error",
                errUsername: "Username not available."
            });
        }
        email = email.toLowerCase();
        const verificationCode = Math.floor(1000 + Math.random() * 9000);
        user = await UsersModel.create({
            name: name,
            email: email,
            userName: userName,
            password: password,
            verificationCode: verificationCode.toString()
        });
        token = jwt.sign({ _id: user.id.toString() },
            process.env.TOKEN_SECRET,
            { expiresIn: "7 days" }
        );
        await UsersModel.updateOne({_id: user.id},{
            token: token
        });
        user = await UsersModel.findOne({_id: user.id}, {password: 0, verificationCode: 0});
        if ( referralLink ) {
            const userOne = await UsersModel.findOne({userName: referralLink}, {password: 0});
            if (userOne) {
                await UsersModel.updateOne({ _id: userOne.id }, {
                    $push: {
                        levelOne: user._id
                    }
                });
                await AffiliationModel.create({
                    user: user.id,
                    referralId: userOne.id,
                    level: 1,
                    commissionPercentage: 7
                });
                const userTwo = await UsersModel.findOne({levelOne: userOne.id}, {password: 0});
                if (userTwo) {
                    await UsersModel.updateOne({ _id: userTwo.id }, {
                        $push: {
                            levelTwo: user._id
                        }
                    });
                    await AffiliationModel.create({
                        user: user.id,
                        referralId: userTwo.id,
                        level: 2,
                        commissionPercentage: 3
                    });
                    const userThree = await UsersModel.findOne({levelOne: userTwo.id}, {password: 0});
                    if (userThree) {
                        await UsersModel.updateOne({_id: userThree.id}, {
                            $push: {
                                levelThree: user._id
                            }
                        });
                        await AffiliationModel.create({
                            user: user.id,
                            referralId: userThree.id,
                            level: 3,
                            commissionPercentage: 1
                        });
                    }
                }
            }
        }
        return res.status(200).json({
            status: "Successful!",
            message: "Successfully Registered as an user",
            data: user
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
        email = email.toLowerCase();
        let user = await UsersModel.findOne({ email: email});
        if ( !user ) {
            return res.status(409).json({
                status: "Error",
                errEmail: "Invalid Email/Password"
            });
        }
        else {
            let isMatch = await user.comparePassword(password);
            if ( !isMatch ) {
                return res.status(409).json({
                    status: "Error",
                    errPassword: "Invalid Email/Password"
                });
            }
            else {
                token = jwt.sign({ _id: user.id.toString() },
                    process.env.TOKEN_SECRET,
                    { expiresIn: "7 days" }
                );
                await UsersModel.update({_id: user.id}, {
                    token: token
                });
                user.token = token;
                user.password = undefined;
                return res.status(200).json({
                    status: "Successful",
                    message: "Successfully Logged In",
                    data: user
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
  Update: async (req, res) => {
    try {
        let id = req.params.id;
        let user = {};
        
        user = await UsersModel.updateOne({_id: id}, {
            $set: req.body
        });
        if (user.ok === 1) {
            user = await UsersModel.findOne({_id: id},{password: 0});
            return res.status(200).json({
                status: "Updated",
                message: "Successfully Updated your Account Information",
                data: user
            });
        }
        else {
            return res.status(409).json({
                status: "Failed",
                message: "Something went wrong"
            });
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
        let id = req.params.id;
        let removeuser = await UsersModel.remove({_id: id});
        if ( removeuser.ok === 1 ) {
            return res.status(200).json({
                status: "Deleted",
                message: "Successfully deleted user account"
            });
        }
        else {
            return res.status(409).json({
                status: "Failed",
                message: "Failed to Delete. Try Again!"
            });
        }
    } catch (error) {
        return res.status(500).json({
            status: "Error",
            message: error.message
        });
    }
  },
  List: async ( req, res ) => {
    try {
        const users = await UsersModel.find({}, {password: 0});
        if ( users.length === 0 ) {
            return res.status(403).json({
                status: "Failed",
                message: "There are no users registered yet!"
            });
        }
        else {
            return res.status(200).json({
                status: "Successfull",
                data: users
            });
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
        const user = await UsersModel.findOne({_id: id}, {password: 0});
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
  Verify: async (req, res) => {
    try {
        const verificationCode = req.body.verificationCode;
        const id = req.decoded._id;
        let user = await UsersModel.findOne({_id: id}, {password: 0});
        if ( !user ) {
            return res.status(403).json({
                status: "Failed",
                message: "Account not Found"
            });
        }
        else {
            if ( verificationCode === user.verificationCode ) {
                await UsersModel.updateOne({_id: id}, {
                    verified: "Yes",
                    verificationCode: null
                });
                user = await UsersModel.findOne({_id: id}, {password: 0});
                return res.status(200).json({
                    status: "Successfull",
                    message: "Account Verified",
                    data: user
                });
            }
            else {
                return res.status(403).json({
                    status: "Failed",
                    errorVerificationCode: "Incorrect Code" 
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
  forgotPassword: async ( req, res ) => {
    try {
        const { email } = req.body;
        const existingAccount = await UsersModel.find({email: email}, {password: 0}).count();
        if (!existingAccount) {
            return res.status(403).json({
                status: "Failed",
                errEmail: "No such email exist"
            });
        }
        else {
            const verificationCode = Math.random().toString(35).substring(2, 34) + Math.random().toString(35).substring(2, 34);
            await UsersModel.updateOne({email: email},{
                changePasswordCode: verificationCode
            });
            const user = await UsersModel.findOne({email: email}, {password: 0});
            changePasswordJob(user);
            return res.status(200).json({
                status: "Successfull",
                message: "A verification Code has been sent to your email. Use the code to change Password."
            });
        }
    } catch (error) {
        return res.status(500).json({
            status: "Error",
            message: error.message
        });
    }
  },
  changePassword: async ( req, res ) => {
    try {
        let { email, verificationCode, newPassword } = req.body;
        const password = bcrypt.hashSync(newPassword, 10);
        const user = await UsersModel.findOne({email: email}, {password: 0});
        if (!user) {
            return res.status(403).json({
                status: "Failed",
                errEmail: "No such account registered"
            });
        }
        else {
            if (user.changePasswordCode !== verificationCode) {
                return res.status(403).json({
                    status: "Failed",
                    errCode: "Invalid Code"
                });
            }
            else {
                await UsersModel.updateOne({email: email},{
                    password: password
                });
                return res.status(200).json({
                    status: "Successfull",
                    message: "Successfully Updated Password. Login with new Password"
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
  updatePassword: async ( req, res ) => {
    try {
        const id = req.params.id;
        const {
            oldPassword,
            newPassword
        } = req.body;
        let user = await UsersModel.findOne({ _id: id });
        const isMatch = await user.comparePassword(oldPassword);
        if (!isMatch) {
            return res.status(403).json({
                status: "Failed",
                errOldPassword: "Incorrect password"
            });
        }
        const password = bcrypt.hashSync(newPassword, 10);
        await UsersModel.updateOne({ _id: id }, {
            password: password
        });
        user = await UsersModel.findOne({ _id: id }, {password: 0});
        return res.status(200).json({
            status: "Successfull",
            message: "Your new password have been set.",
            data: user
        });
    } catch (error) {
        return res.status(500).json({
            status: "Error",
            message: error.message
        });
    }
  },
  walletOTP: async ( req, res ) => {
    try {
        const id = req.params.id;
        let user = await UsersModel.findOne({_id: id}, {password: 0});
        const verificationCode = Math.random().toString(35).substring(2, 34) + 
                                Math.random().toString(35).substring(2, 34) +
                                Math.random().toString(35).substring(2, 34) +
                                Math.random().toString(35).substring(2, 34)
        await UsersModel.updateOne({ _id: id }, {
            changeWalletCode: verificationCode
        });
        user = await UsersModel.findOne({_id: id}, {password: 0});
        changeWalletJob(user);
        return res.status(200).json({
            status: "Successfull",
            message: "A verification code for changing your wallet id has been sent to your email. Use the code for changing your wallet id."
        });
    } catch (error) {
        return res.status(500).json({
            status: "Error",
            message: error.message
        });
    }
  },
  updateWallet: async ( req, res ) => {
    try {
        const id = req.params.id;
        const {
            otp,
            walletID
        } = req.body;
        let user = await UsersModel.findOne({ _id: id });
        if (user.walletId) {
            if (otp !== user.changeWalletCode) {
                return res.status(403).json({
                    status: "Failed",
                    errOTP: "Invalid Verification Code"
                })
            }
        }
        await UsersModel.updateOne({ _id: id }, {
            walletId: walletID,
            changeWalletCode: ''
        });
        user = await UsersModel.findOne({ _id: id }, {password: 0});
        return res.status(200).json({
            status: "Successfull",
            message: "Your wallet Id have been updated.",
            data: user
        });
    } catch (error) {
        return res.status(500).json({
            status: "Error",
            message: error.message
        });
    }
  },
  AdminDashboard: async (req, res) => {
    try {
        let totalDeposits = 0, totalPayouts = 0;

        const totalUsers = await UsersModel.find({}, {password: 0});
        const activeUsers = await UsersModel.find({status: 'Active'}, {password: 0});
        const inActiveUsers = await UsersModel.find({status: 'Inactive'}, {password: 0});
        const programs = await ProgramModel.find({});
        for (const program of programs) {
            totalDeposits += program.investment;
        }
        const payouts = await PayoutsModel.find({});
        for (const payout of payouts) {
            totalPayouts += payout.amount
        }
        const sunday = moment().day("Sunday");
        const weekUsers = await UsersModel.find({
            createdAt: {
                $gt: sunday
            }
        });
        const weekPrograms = await ProgramModel.find({
            createdAt: {
                $gt: sunday
            }
        });
        return res.status(200).json({
            status: "Successful",
            data: {
                totalUsers: totalUsers.length,
                activeUsers: activeUsers.length,
                inActiveUsers: inActiveUsers.length,
                totalDeposits: totalDeposits,
                totalPayouts: totalPayouts,
                weekUsers: weekUsers.length,
                weekPrograms: weekPrograms.length
            }
        });
    } catch (error) {
        return res.status(500).json({
            status: "Error",
            message: error.message
        });
    }
  }
}