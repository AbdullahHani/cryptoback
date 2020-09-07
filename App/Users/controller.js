const UsersModel = require('./model');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const environment = require('dotenv');
const moment = require('moment');

const AffiliationModel = require('../Affiliations/model');
const AffiliationReports = require('../AffiliationReport/model');
const ProgramModel = require('../Programs/model');
const PayoutsModel = require('../Payouts/model');

environment.config();

const sgMail = require('@sendgrid/mail');
sgMail.setApiKey(process.env.SENDGRID_API_KEY);


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
        email = email.toLowerCase();
        userName = userName.toLowerCase();
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
            referralLink = referralLink.toLowerCase();
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
                // let message = '';
                // message= '<img src="https://s12.directupload.net/images/200827/6xtdhlvh.png" style="height:60px;"/><br>' +
                //             '<h2 style="font-weight: 700; text-decoration: underline; text-align:center">Welcome to Odeffe</h2><br>';
                // message += `<h3><b>Dear ${userOne.name}!</b></h3><br>` +
                //             '<p>.</p>' +
                //             '<br><p><b>Regards:</b></p><br><p>Odeffe</p>';
                // message += '<div style="display: flex; justify-content: flex-start;">' + 
                //             '<a href="https://twitter.com/OdeffeOfficial" target="_blank"><img src="https://s12.directupload.net/images/200827/9ow4ycu5.png" height="50"/></a>' +
                //             '<a href="https://www.facebook.com/OdeffeOfficial/" target="_blank"><img src="https://s12.directupload.net/images/200827/iip65qfr.png" height="50"/></a>' +
                //             '<a href="https://www.instagram.com/odeffeofficial/" target="_blank"><img src="https://s12.directupload.net/images/200827/edl3bq6h.png" height="50"/></a>' +
                //             '<a href="https://t.me/OdeffeOfficial" target="_blank"><img src="https://s12.directupload.net/images/200827/vf2frr6w.png" height="50"/></a>' +
                //             '<a href="https://www.youtube.com/channel/UCYToRqJmUI_NnNtMWzWjJHQ?view_as=subscriber" target="_blank"><img src="https://s12.directupload.net/images/200827/h2mwptv7.png" height="50"/></a>' +
                //             '</div>';
                // const msg = {
                //     to: user.email,
                //     from: process.env.SENDER_EMAIL,
                //     subject: `Odeffe: Welcome`,
                //     text: message,
                //     html: message
                // };
                // await sgMail.send(msg);
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
            if (user.block === 'Yes') {
                return res.status(404).json({
                    status: "Failed",
                    message: "You are not authorized to login"
                });
            }
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
                await UsersModel.updateOne({_id: user.id}, {
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
        const users = await UsersModel.find({}, {password: 0}).sort({_id: -1});
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
            const verificationCode = Math.floor(100000 + Math.random() * 900000);
            await UsersModel.updateOne({email: email},{
                changePasswordCode: verificationCode.toString()
            });
            const user = await UsersModel.findOne({email: email}, {password: 0});
            let message = '';
            message= '<img src="https://s12.directupload.net/images/200827/6xtdhlvh.png" style="height:60px;"/><br>' +
                    '<h2 style="font-weight: 700; text-decoration: underline; text-align:center">Forgot Password Change PIN</h2><br>';
            message += `<h3><b>Dear ${user.name}!</b></h3><br>` +
                    `<p>Please enter ${verificationCode} to change your login password.</p><br>` +
                    '<br><p><b>Regards:</b></p><br><p>Odeffe</p><br>';
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
                subject: `Odeffe: Password Change Pin`,
                text: message,
                html: message
            };
            await sgMail.send(msg);
            return res.status(200).json({
                status: "Successful",
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
        let message = '';
        message= '<img src="https://s12.directupload.net/images/200827/6xtdhlvh.png" style="height:60px;"/><br>' +
                '<h2 style="font-weight: 700; text-decoration: underline; text-align:center">Password Changed</h2><br>';
        message += `<h3><b>Dear ${user.name}!</b></h3><br>` +
                '<p>We have noticed that you have changed your password, if this is not done by you then contact support immediately</p><br>' +
                '<p>Email: Support@Odeffe.com</p><br>' +
                '<br><p><b>Regards:</b></p><br><p>Odeffe</p><br>';
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
            subject: `Odeffe: Account Password Changed`,
            text: message,
            html: message
        };
        await sgMail.send(msg);
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
        const verificationCode = Math.random().toString(35).substring(2, 34);
        await UsersModel.updateOne({ _id: id }, {
            changeWalletCode: verificationCode
        });
        user = await UsersModel.findOne({_id: id}, {password: 0});
        let message = '';
        message= '<img src="https://s12.directupload.net/images/200827/6xtdhlvh.png" style="height:60px;"/><br>' +
                '<h2 style="font-weight: 700; text-decoration: underline; text-align:center">PIN for Wallet Address Change</h2><br>';
        message += `<h3><b>Dear ${user.name}!</b></h3><br>` +
                `<p>Please enter ${verificationCode} to change your BCH wallet address.</p><br>` +
                '<br><p><b>Regards:</b></p><br><p>Odeffe</p><br>';
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
            subject: `Odeffe: Wallet update verification code`,
            text: message,
            html: message
        };
        await sgMail.send(msg);
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
        let message = '';
        message= '<img src="https://s12.directupload.net/images/200827/6xtdhlvh.png" style="height:60px;"/><br>' +
                '<h2 style="font-weight: 700; text-decoration: underline; text-align:center">Wallet Address Change</h2><br>';
        message += `<h3><b>Dear ${user.name}!</b></h3><br>` +
                '<p>We have noticed that you have changed your BCH Wallet Address, if this is not done by you then contact support immediately.</p><br>' +
                '<p>Email: Support@Odeffe.com</p><br>' +
                '<br><p><b>Regards:</b></p><br><p>Odeffe</p><br>';
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
            subject: `Odeffe: Wallet Address Changed`,
            text: message,
            html: message
        };
        await sgMail.send(msg);
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
        let totalDeposits = 0, totalPayouts = 0, totalDepositsBCH = 0, totalPendingPayouts = 0; 

        const totalUsers = await UsersModel.find({}, {password: 0});
        const activeUsers = await UsersModel.find({status: 'Active'}, {password: 0});
        const inActiveUsers = await UsersModel.find({status: 'Inactive'}, {password: 0});
        const programs = await ProgramModel.find({});
        for (const program of programs) {
            totalDeposits += program.investment;
            totalDepositsBCH += program.btc;
        }
        const paidPayouts = await PayoutsModel.find({status: 'Paid'});
        for (const payout of paidPayouts) {
            totalPayouts += payout.amount
        }
        const paidAffiliations = await AffiliationReports.find({status: 'Paid'});
        for (const affiliation of paidAffiliations) {
            totalPayouts += affiliation.amount
        }
        const unpaidPayouts = await PayoutsModel.find({status: 'Unpaid'});
        for (const payout of unpaidPayouts) {
            totalPendingPayouts += payout.amount
        }
        const unpaidAffiliations = await AffiliationReports.find({status: 'Unpaid'});
        for (const affiliation of unpaidAffiliations) {
            totalPendingPayouts += affiliation.amount
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
        let weekInvestment = 0;
        for (const program of weekPrograms) {
            weekInvestment += program.btc;
        }
        const programUsers = await ProgramModel.find({
            createdAt: {
                $gt: sunday
            }
        }).distinct('user');
        const PayoutUsers = [];
        let weekPayoutUsers = 0;
        for (const payout of unpaidPayouts) {
            if (weekPayoutUsers === 0) {
                weekPayoutUsers += 1
                PayoutUsers.push(payout.user._id)
            } else if (PayoutUsers.indexOf(payout.user._id) !== -1) {
                weekPayoutUsers += 1
                PayoutUsers.push(payout.user._id)
            }
        }
        for (const affiliation of unpaidAffiliations) {
            if (weekPayoutUsers === 0) {
                weekPayoutUsers += 1
                PayoutUsers.push(affiliation.referralId._id)
            } else if (PayoutUsers.indexOf(affiliation.referralId._id) !== -1) {
                weekPayoutUsers += 1
                PayoutUsers.push(affiliation.referralId._id)
            }
        }
        return res.status(200).json({
            status: "Successful",
            data: {
                totalUsers: totalUsers.length,
                activeUsers: activeUsers.length,
                inActiveUsers: inActiveUsers.length,
                totalDeposits: totalDeposits,
                totalDepositsBCH: totalDepositsBCH,
                totalPayouts: totalPayouts,
                weekUsers: weekUsers.length,
                weekPrograms: weekPrograms.length,
                programUsers: programUsers.length,
                totalPendingPayouts: totalPendingPayouts,
                weekPayoutUsers: weekPayoutUsers,
                weekInvestment: weekInvestment
            }
        });
    } catch (error) {
        return res.status(500).json({
            status: "Error",
            message: error.message
        });
    }
  },
  Resend: async (req, res) => {
    try {
        const id = req.decoded._id;
        const verificationCode = Math.floor(1000 + Math.random() * 9000);
        await UsersModel.updateOne({ _id: id }, {
            verificationCode: verificationCode.toString()
        });
        const user = await UsersModel.findOne({_id: id}, {password: 0});
        let message = '';
        message= '<img src="https://s12.directupload.net/images/200827/6xtdhlvh.png" style="height:60px;"/><br>' +
                    '<h2 style="font-weight: 700; text-decoration: underline; text-align:center">Account Verification Code</h2><br>';
        message += `<h3><b>Dear ${user.name}!</b></h3><br>` +
                    `<p>Your four digit Code for verification is </p><h3>${user.verificationCode}</h3><br>` +
                    '<br><p><b>Regards:</b></p><br><p>Odeffe</p><br>';
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
            subject: `Odeffe: Account Verification Code`,
            text: message,
            html: message
        };
        await sgMail.send(msg);
        return res.status(200).json({
            status: "Successful",
            message: "Verification Code has been send to you email address"
        });
    } catch (error) {
        return res.status(500).json({
            status: "Error",
            message: error.message
        });
    }
  },
  blockUser: async (req, res) => {
    try {
        const id = req.params.id;
        const user = await UsersModel.findOne({_id: id});
        if (user.block === 'Yes') {
            await UsersModel.updateOne({_id: id}, {
                block: "No"
            });
            await ProgramModel.updateMany({
                user: id
            }, {
                programEnds: 'No',
                payWeek: 'Yes',
                active: 'Yes'
            });
            return res.status(200).json({
                status: "Successful",
                message: "Successfully Unblocked User"
            });
        } else {
            await UsersModel.updateOne({_id: id}, {
                block: "Yes"
            });
            await ProgramModel.updateMany({
                user: id
            }, {
                programEnds: 'Yes',
                payWeek: 'No',
                active: 'No'
            });
            return res.status(200).json({
                status: "Successful",
                message: "Successfully Blocked User"
            });
        }
    } catch (error) {
        return res.status(500).json({
            status: "Error",
            message: error.message
        })
    }
  }
}