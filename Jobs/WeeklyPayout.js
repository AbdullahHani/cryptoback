// const Queue = require('bull');
// const setQueues = require('bull-board').setQueues;

// const sgMail = require('@sendgrid/mail');

// const environment = require('dotenv');
// environment.config();

// const redisOptions = require('../constant/redisConnection');

// sgMail.setApiKey(process.env.SENDGRID_API_KEY);

// const weeklyPayoutEmailQueue = new Queue('WeeklyPayoutEmail', redisOptions);
// setQueues([weeklyPayoutEmailQueue]);

// weeklyPayoutEmailQueue.process(async (job, done) => {
//     const user = job.data.user;
//     const plan = job.data.plan;
//     const amount = job.data.amount.toFixed(4);
//     let message = '';
//     message += `<h3><b>Dear ${user.name}!</b></h3><br>` +
//                 `<p>${amount} BCH have been successfully added to your account from your ${plan.name} plan subscribed. </p><br>` +
//                 '<br><h3><b>Thank You!</b></h3>'
//     const msg = {
//         to: user.email,
//         from: process.env.SENDER_EMAIL,
//         subject: `Odeffe:Weekly Payout`,
//         text: message,
//         html: message
//     };
//     await sgMail.send(msg);
//     done();
// });

// module.exports = async (user, plan, amount) => {
//     await weeklyPayoutEmailQueue.add({
//         user: user,
//         plan: plan,
//         amount: amount
//     });
// }