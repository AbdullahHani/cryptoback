const Queue = require('bull');
const setQueues = require('bull-board').setQueues;

const ProgramModel = require('../App/Programs/model');
const UserModel = require('../App/Users/model');
const PayoutModel = require('../App/Payouts/model');

const environment = require('dotenv');
environment.config();

const redisOptions = require('../constant/redisConnection');

const weeklyPayout = require('./WeeklyPayout');

const weeklyCommissionQueue = new Queue('weeklyCommission', redisOptions);
setQueues([weeklyCommissionQueue]);

weeklyCommissionQueue.process( async (job, done) => {
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
        if ((program.days + 1) === program.totalDays) {
            await ProgramModel.updateOne({ _id: program._id}, {
                programEnds: 'Yes'
            });
        }
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
            program: program._id
        });
        weeklyPayout(user, program.plan, program.weeklyCommission);
        if (runningPrograms === 0) {
            await UserModel.updateOne({_id: program.user._id}, {
                status: 'Inactive'
            });
        }
    }
    done();
});

module.exports = async () => {
    await weeklyCommissionQueue.add({}, {
        repeat: {cron: '30 23 * * 7'}
    });
}