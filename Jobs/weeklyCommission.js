const Queue = require('bull');
const setQueues = require('bull-board').setQueues;

const ProgramModel = require('../App/Programs/model');
const UserModel = require('../App/Users/model');
const PayoutModel = require('../App/Payouts/model');

const sgMail = require('@sendgrid/mail');
sgMail.setApiKey(process.env.SENDGRID_API_KEY);

const environment = require('dotenv');
environment.config();

const redisOptions = require('../constant/redisConnection');

const weeklyPayout = require('./WeeklyPayout');

const weeklyCommissionQueue = new Queue('weeklyCommission', redisOptions);
setQueues([weeklyCommissionQueue]);

weeklyCommissionQueue.process( async (job, done) => {
    let table = '<table style="width: 100%; text-align: center; table-layout: fixed; border-collapse: collapse; border: 1px solid black;"><tr><th style="border: 1px solid black;">Username</th><th style="border: 1px solid black;">Email</th><th style="border: 1px solid black;">Amount</th><th style="border: 1px solid black;">Wallet Address</th></tr>';
    const programs = await ProgramModel.find({
        payWeek: 'Yes'
    });
    for (const program of programs) {
        const commission = program.totalCommission + program.weeklyCommission;
        await ProgramModel.updateOne({ _id: program._id }, {
            totalCommission: commission,
            weeklyCommission: 0,
            payWeek: 'No'
        });
        const runningPrograms = await ProgramModel.find({
            user: program.user._id,
            programEnds: 'No'
        }).count();
        const user = await UserModel.findOne({_id: program.user._id});
        const balance = user.balance + program.weeklyCommission;
        const payoutAmount = user.totalPayouts + program.weeklyCommission;
        await UserModel.updateOne({_id: program.user._id}, {
            balance: balance,
            totalPayouts: payoutAmount,
            plan: program.plan._id
        });
        await PayoutModel.create({
            user: program.user._id,
            amount: program.weeklyCommission,
            plan: program.plan._id,
            program: program._id,
            hash: program.hash
        });
        weeklyPayout(user, program.plan, program.weeklyCommission);
        if (runningPrograms === 0) {
            await UserModel.updateOne({_id: program.user._id}, {
                status: 'Inactive'
            });
        }
        table += `<tr><td style="border: 1px solid black;">${program.user.userName}</td><td style="border: 1px solid black;">${program.user.email}</td><td style="border: 1px solid black;">${program.weeklyCommission}</td><td style="border: 1px solid black;">${program.user.walletId}</td></tr>`;
    }        
    let emailMessage = `<strong>Hello Admin!</strong><br><p>The weekly payout list is ready. You have to pay this amount in BCH to the following users on their address.</p><br>`;
    emailMessage += `<h3>User/Payout List</h3><br>` + table + `<br><h3>Thank You!</h3>`;

    const msg = {
        from: process.env.RECEIVER_EMAIL,
        to: process.env.SENDER_EMAIL,
        subject: `Odeffe: Weekly Payouts`,
        text: emailMessage,
        html: emailMessage
    };
    await sgMail.send(msg);
    done();
});

module.exports = async () => {
    await weeklyCommissionQueue.add({}, {
        repeat: {cron: '30 23 * * 7'}
    });
}