const express = require('express');
const session = require('express-session');
const bodyParser = require('body-parser');
const cookieParser = require('cookie-parser');
const morganLogger = require('morgan');
const mongoose = require('mongoose');
const environment = require('dotenv');
const cors = require('cors');

const Admin = require('./App/Admin/routes');
const Users = require('./App/Users/routes');
const Plans = require('./App/Plans/routes');
const Affiliations = require('./App/Affiliations/routes');
const AffReports = require('./App/AffiliationReport/routes');
const Programs = require('./App/Programs/routes');
const Payouts = require('./App/Payouts/routes');
const DPayouts = require('./App/DPayouts/routes');
const SuperAdmin = require('./App/SuperAdmin/routes');
const Configurations = require('./App/Configurations/routes');

const dailyCommissions = require('./Jobs/DailyCommissions');
const weeklyCommissions = require('./Jobs/weeklyCommission');

const adminVerification = require('./Functions/Middlewares').adminAuthentication;
const bullBoardUI = require('bull-board').UI;

environment.config();

const app = express();

app.set('view engine', 'ejs');

app.options('*', cors());
app.use(cors());

const run = async () => {
  await mongoose.connect(process.env.MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
      useCreateIndex: true
    });
}
run();

app.use(morganLogger('dev'));
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json({
  verify: (req, res, buf) => {
    req.rawBody = buf
  }
}));
app.use(cookieParser());
app.use(session({
    secret: process.env.SESSION_SECRET,
    saveUninitialized: true,
    resave: true,
    cookie: { maxAge: 3600000 }
}));

app.use('/api/admin', Admin);
app.use('/api/users', Users);
app.use('/api/plans', Plans);
app.use('/api/affiliations', Affiliations);
app.use('/api/reports', AffReports);
// app.use('/api/paykassa', Paykassa);
app.use('/api/programs', Programs);
app.use('/api/payouts', Payouts);
app.use('/api/dailypayouts', DPayouts);
app.use('/api/configurations', Configurations);
app.use('/admin/schedule', adminVerification, bullBoardUI);
app.use('/admin', SuperAdmin);

app.get('/', function (req, res) {
  res.render('pages/login');
});

dailyCommissions();
weeklyCommissions();

app.use(function (err, req, res, next) {
  if(err.message)
    res.status(404).json({ status: "Error", message: err.message});
  else if (err.status === 404)
    res.status(404).json({ message: "Not found" });
  else
    res.status(500).json({ message: "Something looks wrong :( !!!"});
});

app.listen(process.env.PORT || 4100, function () {
    console.log('Node server listening on port 4100');
});