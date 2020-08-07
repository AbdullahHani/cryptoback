const express = require('express');
const middleware = require('../../Functions/Middlewares');
const Controller = require('./controller');

const router = express.Router();

router.post('/', Controller.Create);
router.post('/login', Controller.Login);
router.post('/email', Controller.EmailUs);
// router.get('/', middleware.authenticateToken, Controller.ListUsers);
router.patch('/:id', middleware.authenticateToken, Controller.Update);
router.delete('/:id', middleware.authenticateToken, Controller.Remove);
router.get('/:id', middleware.authenticateToken, Controller.View);

module.exports = router;