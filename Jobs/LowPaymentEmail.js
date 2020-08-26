// const Queue = require('bull');
// const setQueues = require('bull-board').setQueues;

// const sgMail = require('@sendgrid/mail');

// const environment = require('dotenv');
// environment.config();

// const redisOptions = require('../constant/redisConnection');

// sgMail.setApiKey(process.env.SENDGRID_API_KEY);

// const lowPaymentEmailQueue = new Queue('LowPaymentEmail', redisOptions);
// setQueues([lowPaymentEmailQueue]);

// lowPaymentEmailQueue.process(async (job, done) => {
//     const user = job.data.user;
//     let message = '';
//     message += `<h3><b>Dear ${user.name}!</b></h3><br>` +
//                 '<p>You did not transferred the right amount. Contact or support for the refend of your money to buy a plan again.</p><br>' +
//                 '<br><h3><b>Thank You!</b></h3>'
//     const msg = {
//         to: user.email,
//         from: process.env.SENDER_EMAIL,
//         subject: `Odeffe:Low Payment Transferred`,
//         text: message,
//         html: message
//     };
//     await sgMail.send(msg);
//     done();
// });

// module.exports = async (user) => {
//     await lowPaymentEmailQueue.add({
//         user: user
//     });
// }