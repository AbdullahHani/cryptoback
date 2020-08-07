const Queue = require('bull');
const setQueues = require('bull-board').setQueues;

const sgMail = require('@sendgrid/mail');

const environment = require('dotenv');
environment.config();

const redisOptions = require('../constant/redisConnection');

sgMail.setApiKey(process.env.SENDGRID_API_KEY);

const userRegistrationEmailQueue = new Queue('userRegistrationEmail', redisOptions);
setQueues([userRegistrationEmailQueue]);

userRegistrationEmailQueue.process(async (job, done) => {
    const user = job.data.user;
    let message = '';
    message += `<h3><b>Dear ${user.name}!</b></h3><br>` +
                '<p>Thank you for registering into Odeffe.</p><br>' +
                `<p>To continue you need to verify your account.</p><br>` +
                `<p>Your four digit Code for verification is </p><h3>${user.verificationCode}</h3><br>` +
                '<br><h3><b>Thank You!</b></h3>'
    const msg = {
        to: user.email,
        from: process.env.SENDER_EMAIL,
        subject: `Odeffe:user Account Verification`,
        text: message,
        html: message
    };
    await sgMail.send(msg);
    done();
});

module.exports = async (user) => {
    await userRegistrationEmailQueue.add({user: user});
}