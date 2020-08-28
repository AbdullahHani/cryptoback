const express = require('express');
const middleware = require('../../Functions/Middlewares');
const Controller = require('./controller');

const router = express.Router();

router.post('/', middleware.authenticateToken, Controller.Create);
router.get('/', middleware.authenticateToken, Controller.List);
router.post('/manual', middleware.authenticateToken, Controller.ManualStart);
router.get('/:id', middleware.authenticateToken, Controller.View);
router.patch('/activate/:id', middleware.authenticateToken, Controller.updateActivation);

module.exports = router;