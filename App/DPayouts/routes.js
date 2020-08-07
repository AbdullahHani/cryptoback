const express = require('express');
const middleware = require('../../Functions/Middlewares');
const Controller = require('./controller');

const router = express.Router();

router.get('/', middleware.authenticateToken, Controller.List);

module.exports = router;