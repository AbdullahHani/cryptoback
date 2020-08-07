const express = require('express');
const middleware = require('../../Functions/Middlewares');
const Controller = require('./controller');

const router = express.Router();

router.post('/', Controller.Create);
// router.get('/', middleware.authenticateToken, Controller.ListUsers);
router.patch('/:id', middleware.authenticateToken, Controller.Update);
router.delete('/:id', middleware.authenticateToken, Controller.Remove);
// router.get('/:id', middleware.authenticateToken, Controller.viewUser);

module.exports = router;