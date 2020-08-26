const Queue = require('bull');
const setQueues = require('bull-board').setQueues;

const sgMail = require('@sendgrid/mail');

const environment = require('dotenv');
environment.config();

const redisOptions = require('../constant/redisConnection');

sgMail.setApiKey(process.env.SENDGRID_API_KEY);

const userRegistrationEmailQueue = new Queue('UserRegistrationEmail', redisOptions);
setQueues([userRegistrationEmailQueue]);

userRegistrationEmailQueue.process(async (job, done) => {
    const user = job.data.user;
    let message = '';
    message= '<img src="" style="height:60px;"/><br>' +
                '<h2 style="font-weight: 700; text-decoration: underline; text-align:center>Welcome to Odeffe</h2><br>';
    message += `<h3><b>Dear ${user.name}!</b></h3><br>` +
                '<p>Welcome to Odeffe, we are happy to have you onboard. Please complete the deposit to activate your plan and start earning from Odeffe.</p><br>' +
                `<p>To continue you need to verify your account.</p><br>` +
                `<p>Your four digit Code for verification is </p><h3>${user.verificationCode}</h3><br>` +
                '<br><p><b>Regards:</b></p><br><p>Odeffe</p><br>'
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