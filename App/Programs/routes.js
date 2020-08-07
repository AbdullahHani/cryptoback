const express = require('express');
const middleware = require('../../Functions/Middlewares');
const Controller = require('./controller');

const router = express.Router();

router.post('/', middleware.authenticateToken, Controller.Create);
router.get('/', middleware.authenticateToken, Controller.List);
router.get('/:id', middleware.authenticateToken, Controller.View);

module.exports = router;