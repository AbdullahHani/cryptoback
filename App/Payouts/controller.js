const PayoutModel = require('./model');
const AdminModel = require('../Admin/model');
const ProgramModel = require('../Programs/model');
const UsersModel = require('../Users/model');

const environment = require('dotenv');
environment.config();

const sgMail = require('@sendgrid/mail');
sgMail.setApiKey(process.env.SENDGRID_API_KEY);

module.exports = {
  List: async (req, res) => {
    try {
        const id = req.decoded._id;
        const status = req.query.status === 'undefined' ? '' : req.query.status;
        let payouts = [];
        const isAdmin = await AdminModel.findOne({ _id: id }, { password: 0 });
        if (!isAdmin) {
          payouts = await PayoutModel.find({
            user: id,
            status: 'Paid'
          }).sort({_id: -1});  
        } else {
          if (!status) {
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
        const payoutData = await PayoutModel.findOne({_id: payout._id});
        if (payout.status === 'Paid' && payoutData.status === 'Unpaid') {
          await PayoutModel.updateOne({_id: payout._id}, {
            status: 'Paid',
            txid: payout.txid
          });
          const payoutNew = await PayoutModel.findOne({_id: payout._id});
          const user = await UsersModel.findOne({userName: payout.user});
          const balance = user.balance + payoutNew.amount;
          const totalPayouts = user.totalPayouts + payoutNew.amount;
          await UsersModel.updateOne({_id: user._id}, {
            balance: balance,
            totalPayouts: totalPayouts
          });
          let message = '';
          message= '<img src="https://s12.directupload.net/images/200827/6xtdhlvh.png" style="height:60px;"/><br>' +
                      '<h2 style="font-weight: 700; text-decoration: underline; text-align:center">Weekly Payout Transferred</h2><br>';
          message += `<h3><b>Dear ${user.name}!</b></h3><br>` +
                      `<p>We transferred ${payoutNew.amount.toFixed(4)} BTC to your wallet. The transaction hash of the transferred amount is: ${payout.txid}. </p>` +
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
              subject: `Odeffe: Weekly Payout`,
              text: message,
              html: message
          };
          await sgMail.send(msg);
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
  },
  chartData: async (req, res) => {
    try {
      const id = req.decoded._id;
      const chartData = {
        chart: {
          caption: "",
          subcaption: "Program Progress",
          numbersuffix: "BTC",
          theme: "fusion"
        },
        colorrange: {
          color: [
            {
              minvalue: "0",
              maxvalue: "50",
              code: "#F2726F"
            },
            {
              minvalue: "50",
              maxvalue: "75",
              code: "#FFC533"
            },
            {
              minvalue: "75",
              maxvalue: "100",
              code: "#62B58F"
            }
          ]
        },
        value: "",
        target: ""
      };
      const charts = [];
      const programs = await ProgramModel.find({
        user: id,
        programEnds: 'No'
      });
      for (const program of programs) {
        chartData.chart.caption = program.plan.name;
        chartData.value = (program.totalCommission.toFixed(4)).toString();
        chartData.target = (program.btc * 1.8).toString()
        charts.push(chartData);
      }
      return res.status(200).json({
        status: "Successful",
        data: charts
      });
    } catch (error) {
      return res.status(500).json({
        status: "Successful",
        message: error.message
      });
    }
  },
  jqChart: async (req, res) => {
    try {
      const id = req.decoded._id;
      let chartData = {
        title: 'Revenue 2014 YTD',
        description: '(U.S. $ in thousands)',
        ranges: [
          { startValue: 0, endValue: 200, color: '#00C5FF', opacity: 0.1 },
          { startValue: 200, endValue: 250, color: '#00C5FF', opacity: 0.3 },
          { startValue: 250, endValue: 300, color: '#00C5FF', opacity: 0.5 }
        ],
        pointer: {
          value: 270,
          label: 'Revenue 2014 YTD',
          size: '25%',
          color: 'Black'
        },
        target: {
          value: 260,
          label: 'Revenue 2013 YTD',
          size: 4,
          color: 'Black'
        },
        ticks: {
          position: 'both',
          interval: 50,
          size: 10
        }
      };
      const charts = [];
      const programs = await ProgramModel.find({
        user: id,
        programEnds: 'No'
      });
      for (const program of programs) {
        const totalCommission = program.btc * 2;
        chartData.ranges[0].endValue = (totalCommission * 0.5).toFixed(2);
        chartData.ranges[1].startValue = (totalCommission * 0.5).toFixed(2);
        chartData.ranges[1].endValue = (totalCommission * 0.75).toFixed(2);
        chartData.ranges[2].startValue = (totalCommission * 0.75).toFixed(2);
        chartData.ranges[2].endValue = totalCommission;
        chartData.ticks.interval = totalCommission / 4;
        chartData.title = program.plan.name;
        chartData.description = 'Program Progress in (BCH)';
        chartData.target.value = (program.btc * 1.8).toFixed(4);
        chartData.target.label = `Target: ${(program.btc * 1.8).toFixed(4)}`;
        chartData.pointer.value = program.totalCommission.toFixed(4);
        chartData.pointer.label = `Current: ${program.totalCommission.toFixed(4)}`;
        charts.push(chartData);
      }
      return res.status(200).json({
        status: "Successful",
        data: charts
      });
    } catch (error) {
      return res.status(500).json({
        status: "Error",
        message: error.message
      });
    }
  }
}