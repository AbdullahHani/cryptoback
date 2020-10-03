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

const weeklyCommissionQueue = new Queue('weeklyCommissionJob', redisOptions);
setQueues([weeklyCommissionQueue]);

weeklyCommissionQueue.process( async (job, done) => {
    let table = '<table style="width: 100%; text-align: center; table-layout: fixed; border-collapse: collapse; border: 1px solid black;"><tr><th style="border: 1px solid black;">Username</th><th style="border: 1px solid black;">Email</th><th style="border: 1px solid black;">Amount</th><th style="border: 1px solid black;">Wallet Address</th></tr>';
    const programs = await ProgramModel.find({
        payWeek: 'Yes'
    });
    for (const program of programs) {
        if (program.user.isDeleted !== 'Yes' && program.user.block !== 'Yes') {
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
            // const user = await UserModel.findOne({_id: program.user._id});
            // const balance = user.balance + program.weeklyCommission;
            // const payoutAmount = user.totalPayouts + program.weeklyCommission;
            // await UserModel.updateOne({_id: program.user._id}, {
            //     balance: balance,
            //     totalPayouts: payoutAmount,
            //     plan: program.plan._id
            // });
            await PayoutModel.create({
                user: program.user._id,
                amount: program.weeklyCommission,
                plan: program.plan._id,
                program: program._id,
                hash: program.hash
            });
            // let message = '';
            // message += `<h3><b>Dear ${user.name}!</b></h3><br>` +
            //             `<p>${program.weeklyCommission.toFixed(4)} BCH have been successfully added to your account from your ${program.plan.name} plan subscribed. </p><br>` +
            //             '<br><h3><b>Thank You!</b></h3>'
            // const msg = {
            //     to: user.email,
            //     from: process.env.SENDER_EMAIL,
            //     subject: `Odeffe: Weekly Payout`,
            //     text: message,
            //     html: message
            // };
            // await sgMail.send(msg);
            if (runningPrograms === 0) {
                await UserModel.updateOne({_id: program.user._id}, {
                    status: 'Inactive'
                });
            }
            table += `<tr><td style="border: 1px solid black;">${program.user.userName}</td><td style="border: 1px solid black;">${program.user.email}</td><td style="border: 1px solid black;">${program.weeklyCommission}</td><td style="border: 1px solid black;">${program.user.walletId}</td></tr>`;
        }
    }
    table += '</table><br>';
    let emailMessage = '';
    emailMessage = '<img src="https://s12.directupload.net/images/200827/6xtdhlvh.png" style="height:60px;"/><br>'
    emailMessage = `<strong>Hello Admin!</strong><br><p>The weekly payout list is ready. You have to pay this amount in BCH to the following users on their address.</p><br>`;
    emailMessage += `<h3>User/Payout List</h3><br>` + table + `<br><p>Regards!</p><p>Odeffe</p>`;
    emailMessage += '<div style="display: flex; justify-content: flex-start;">' + 
                '<a href="https://twitter.com/OdeffeOfficial" target="_blank"><img src="https://s12.directupload.net/images/200827/9ow4ycu5.png" height="50"/></a>' +
                '<a href="https://www.facebook.com/OdeffeOfficial/" target="_blank"><img src="https://s12.directupload.net/images/200827/iip65qfr.png" height="50"/></a>' +
                '<a href="https://www.instagram.com/odeffeofficial/" target="_blank"><img src="https://s12.directupload.net/images/200827/edl3bq6h.png" height="50"/></a>' +
                '<a href="https://t.me/OdeffeOfficial" target="_blank"><img src="https://s12.directupload.net/images/200827/vf2frr6w.png" height="50"/></a>' +
                '<a href="https://www.youtube.com/channel/UCYToRqJmUI_NnNtMWzWjJHQ?view_as=subscriber" target="_blank"><img src="https://s12.directupload.net/images/200827/h2mwptv7.png" height="50"/></a>' +
                '</div>';

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
        repeat: {cron: '0 0 * * 0'}
    });
}