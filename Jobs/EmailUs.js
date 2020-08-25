const Queue = require('bull');
const setQueues = require('bull-board').setQueues;

const sgMail = require('@sendgrid/mail');

const environment = require('dotenv');
environment.config();

const redisOptions = require('../constant/redisConnection');

sgMail.setApiKey(process.env.SENDGRID_API_KEY);

const emailUsQueue = new Queue('EmailUs', redisOptions);
setQueues([emailUsQueue]);

emailUsQueue.process(async (job, done) => {
    try {
        const data = job.data.data;
        const msg = {
            to: process.env.RECEIVER_EMAIL,
            from: data.email,
            subject: data.subject,
            text: data.message,
            html: data.message
        };
        await sgMail.send(msg);
    } catch (error) {
        console.log(error);
    }
    done();
});

module.exports = async (data) => {
    await emailUsQueue.add({data: data});
}