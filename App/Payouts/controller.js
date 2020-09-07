const PayoutModel = require('./model');
const AdminModel = require('../Admin/model');
const ProgramModel = require('../Programs/model');
const UsersModel = require('../Users/model');

module.exports = {
  List: async (req, res) => {
    try {
        const id = req.decoded._id;
        const status = req.query.status;
        let payouts = [];
        const isAdmin = await AdminModel.findOne({ _id: id }, { password: 0 });
        if (!isAdmin) {
          payouts = await PayoutModel.find({
            user: id,
            status: 'Paid'
          }).sort({_id: -1});  
        } else {
          if (!type) {
            payouts = await PayoutModel.find({}).sort({_id: -1});
          } else {
            payouts = await PayoutModel.find({ status: status }).sort({_id: -1});
          }
        }
        return res.status(200).json({
            status: "Successful",
            data: payouts
        });
    } catch (error) {
        return res.status(500).json({
            status: "Error",
            message: error.message
        });
    }
  },
  GraphData: async ( req, res ) => {
    try {
      const id = req.decoded._id;
      const graphData = [];
      const series = []
      const chartOptions = {
        chart: {
          height: 450,
          type: 'line',
          zoom: {
            enabled: false
          }
        },
        dataLabels: {
          enabled: false
        },
        stroke: {
          curve: 'straight'
        },
        title: {
          text: 'Payouts',
          align: 'center'
        },
        grid: {
          row: {
            colors: ['#ffffff', 'transparent'], // takes an array which will be repeated on columns
            opacity: 0
          },
        },
        xaxis: {
          categories: [],
          title: {
            text: 'Weeks'
          }
        },
        yaxis: {
          title: {
            text: 'Amount (Bitcoin Cash)'
          }
        }
      }
      const programs = await ProgramModel.find({
        user: id,
        programEnds: 'No'
      });
      for (const program of programs) {
        const data = [];
        const payouts = await PayoutModel.find({program: program._id});
        data.push(0);
        for (const payout of payouts) {
          data.push(payout.amount.toFixed(4));
        }
        const obj = {
          name: program.plan.name,
          data: data
        }
        series.push(obj);
      }
      let length = 0;
      for (const item of series) {
        if (item.data.length > length) {
          length = item.data.length;
        }
      }
      const category = []
      for (let i = 0; i < length; i++) {
        if ( i === 0 ) {
          category.push('ProgramStarted')
        } else {
          category.push(( i ).toString());
        }
      }
      chartOptions.xaxis.categories = category;
      return res.status(200).json({
        status: "Successful",
        series: series,
        chartOptions: chartOptions
      });
    } catch (error) {
      return res.status(500).json({
        status: "Error",
        message: error.message
      });
    }
  },
  BulkUpdate: async (req, res) =>{
    try {
      const { payouts } = req.body;
      for (const payout of payouts) {
        if (status === 'Paid') {
          await PayoutModel.updateOne({_id: payout._id}, {
            status: 'Paid',
            txid: payout.txid
          });
          const payoutNew = await PayoutModel.findOne({_id: payout._id});
          const user = await UsersModel.findOne({userName: payout.userName});
          const balance = user.balance + payoutNew.amount;
          const totalPayouts = user.totalPayouts + payoutNew.amount;
          await UsersModel.updateOne({_id: user._id}, {
            balance: balance,
            totalPayouts: totalPayouts
          });
        }
      }
      return res.status(200).json({
        status: "Successful",
        message: "Successfully Updated Payout Status"
      });
    } catch (error) {
      return res.status(500).json({
        status: "Error",
        message: error.message
      });
    }
  }
}