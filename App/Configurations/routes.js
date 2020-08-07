const express = require('express');
const middleware = require('../../Functions/Middlewares');
const Controller = require('./controller');

const router = express.Router();

router.post('/', Controller.Create);
router.get('/', middleware.authenticateToken, Controller.View);
router.patch('/:id', middleware.authenticateToken, Controller.Update);

module.exports = router;