const express = require('express');
const Controller = require('./controller');

const router = express.Router();

router.get('/', Controller.Webhook);

module.exports = router;