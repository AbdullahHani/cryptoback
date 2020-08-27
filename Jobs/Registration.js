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
    message= '<img src="https://s12.directupload.net/images/200827/6xtdhlvh.png" style="height:60px;"/><br>' +
                '<h2 style="font-weight: 700; text-decoration: underline; text-align:center">Welcome to Odeffe</h2><br>';
    message += `<h3><b>Dear ${user.name}!</b></h3><br>` +
                '<p>Welcome to Odeffe, we are happy to have you onboard. Please complete the deposit to activate your plan and start earning from Odeffe.</p>' +
                `<p>To continue you need to verify your account.</p>` +
                `<p>Your four digit Code for verification is </p><h3>${user.verificationCode}</h3>` +
                '<br><p><b>Regards:</b></p><br><p>Odeffe</p>';
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
        subject: `Odeffe: Welcome`,
        text: message,
        html: message
    };
    await sgMail.send(msg);
    done();
});

module.exports = async (user) => {
    await userRegistrationEmailQueue.add({user: user});
}