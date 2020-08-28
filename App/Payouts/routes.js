const express = require('express');
const middleware = require('../../Functions/Middlewares');
const Controller = require('./controller');

const router = express.Router();

router.get('/', middleware.authenticateToken, Controller.List);
router.get('/graph', middleware.authenticateToken, Controller.GraphData);
router.patch('/bulkupdate', middleware.authenticateToken, Controller.BulkUpdate);

module.exports = router;