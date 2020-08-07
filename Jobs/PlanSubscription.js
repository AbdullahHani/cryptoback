const Queue = require('bull');
const setQueues = require('bull-board').setQueues;

const sgMail = require('@sendgrid/mail');

const environment = require('dotenv');
environment.config();

const redisOptions = require('../constant/redisConnection');

sgMail.setApiKey(process.env.SENDGRID_API_KEY);

const planSubscriptionEmailQueue = new Queue('planSubscriptionEmail', redisOptions);
setQueues([planSubscriptionEmailQueue]);

planSubscriptionEmailQueue.process(async (job, done) => {
    const user = job.data.user;
    const plan = job.data.plan;
    let message = '';
    message += `<h3><b>Dear ${user.name}!</b></h3><br>` +
                '<p>You have successfully subscribed a plan on Odeffe.</p><br>' +
                `<p>Plan: ${plan.name}.</p><br>Weekly Commission: ${plan.weeklyCommission}` +
                '<br><h3><b>Thank You!</b></h3>'
    const msg = {
        to: user.email,
        from: process.env.SENDER_EMAIL,
        subject: `Odeffe:Plan Subscription`,
        text: message,
        html: message
    };
    await sgMail.send(msg);
    done();
});

module.exports = async (user, plan) => {
    await planSubscriptionEmailQueue.add({
        user: user,
        plan: plan
    });
}