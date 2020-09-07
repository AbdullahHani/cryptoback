const Queue = require('bull');
const setQueues = require('bull-board').setQueues;

const sgMail = require('@sendgrid/mail');

const environment = require('dotenv');
environment.config();

const redisOptions = require('../constant/redisConnection');

sgMail.setApiKey(process.env.SENDGRID_API_KEY);

const planSubscriptionEmailQueue = new Queue('PlanSubscriptionEmail', redisOptions);
setQueues([planSubscriptionEmailQueue]);

planSubscriptionEmailQueue.process(async (job, done) => {
    const user = job.data.user;
    const plan = job.data.plan;
    const investment = job.data.investment;
    let message = '';
    message= '<img src="https://s12.directupload.net/images/200827/6xtdhlvh.png" style="height:60px;"/><br>' +
                '<h2 style="font-weight: 700; text-decoration: underline; text-align:center">Congratulations on Package Activation</h2><br>';
    message += `<h3><b>Dear ${user.name}!</b></h3><br>` +
                `<p>Thank you for investing ${investment.toFixed(4)} with Odeffe, your ${plan.name} plan is activated. Please update the BCH wallet address to ensure on time auto credits to your account.</p><br>` +
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
        subject: `Odeffe:Plan Subscription`,
        text: message,
        html: message
    };
    await sgMail.send(msg);
    done();
});

module.exports = async (user, plan, amount) => {
    await planSubscriptionEmailQueue.add({
        user: user,
        plan: plan,
        investment: amount
    });
}