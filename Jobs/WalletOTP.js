// const Queue = require('bull');
// const setQueues = require('bull-board').setQueues;

// const sgMail = require('@sendgrid/mail');

// const environment = require('dotenv');
// environment.config();

// const redisOptions = require('../constant/redisConnection');

// sgMail.setApiKey(process.env.SENDGRID_API_KEY);

// const walletOTPEmailQueue = new Queue('WalletOTPEmail', redisOptions);
// setQueues([walletOTPEmailQueue]);

// walletOTPEmailQueue.process(async (job, done) => {
//     const user = job.data.user;
//     let message = '';
//     message += `<h3><b>Dear ${user.name}!</b></h3><br>` +
//                 `<p>Your verification code for changing Wallet ID is </p><h3>${user.changeWalletCode}</h3><br>` +
//                 '<br><h3><b>Thank You!</b></h3>'
//     const msg = {
//         to: user.email,
//         from: process.env.SENDER_EMAIL,
//         subject: `Odeffe: Wallet update verification code`,
//         text: message,
//         html: message
//     };
//     await sgMail.send(msg);
//     done();
// });

// module.exports = async (user) => {
//     await walletOTPEmailQueue.add({user: user});
// }