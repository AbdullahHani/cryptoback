const Queue = require('bull');
const setQueues = require('bull-board').setQueues;

const ProgramModel = require('../App/Programs/model');
const DPayoutsModel = require('../App/DPayouts/model');

const BlockchainExc = require('blockchain.info/exchange');

const environment = require('dotenv');
environment.config();

const redisOptions = require('../constant/redisConnection');

const dailyCommissionQueue = new Queue('dailyCommission', redisOptions);
setQueues([dailyCommissionQueue]);

dailyCommissionQueue.process( async (job, done) => {
    let commission = 0, commissionToAdd = 0;
    const programs = await ProgramModel.find({
        programEnds: 'No'
    });
    for (const program of programs) {
        if (program.days < program.totalDays) {
            const tCommission = await BlockchainExc.fromBTC(program.totalCommission, 'USD');
            const dCommission = await BlockchainExc.toBTC((program.investment * program.plan.dailyCommision / 100), 'USD');
            const wCommission = await BlockchainExc.fromBTC((program.weeklyCommission + dCommission), 'USD');
            if (tCommission < (program.investment * 1.8)) {
                if ((tCommission + wCommission) <= (program.investment * 1.8)) {
                    commission = program.weeklyCommission + dCommission
                    commissionToAdd = dCommission;
                } else {
                    const value = (program.investment * 1.8) - tCommission - await BlockchainExc.fromBTC(program.weeklyCommission, 'USD');
                    commissionToAdd = await BlockchainExc.toBTC(value, 'USD');
                    commission = program.weeklyCommission + commissionToAdd;
                    await ProgramModel.updateOne({ _id: program._id }, {
                        programEnds: 'Yes'
                    });
                }
            }
            const days = program.days + 1;
            await ProgramModel.updateOne({ _id: program._id }, {
                days: days,
                payWeek: 'Yes',
                weeklyCommission: commission
            });
            await DPayoutsModel.create({
                user: program.user._id,
                amount: commissionToAdd,
                plan: program.plan._id,
                program: program._id
            });
        }
    }
    done();
});

module.exports = async () => {
    await dailyCommissionQueue.add({}, {
        repeat: {cron: '0 23 * * 1-5'}
    });
}