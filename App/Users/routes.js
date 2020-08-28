const express = require('express');
const middleware = require('../../Functions/Middlewares');
const Controller = require('./controller');

const router = express.Router();

router.post('/', Controller.Create);
router.post('/login', Controller.Login);
router.get('/', middleware.authenticateToken, Controller.List);
router.post('/forgotpassword', Controller.forgotPassword);
router.post('/changepassword', Controller.changePassword);
router.get('/dashboard', middleware.authenticateToken, Controller.AdminDashboard);
router.post('/verify', middleware.authenticateToken, Controller.Verify);
router.get('/resendcode', middleware.authenticateToken, Controller.Resend)
router.patch('/:id', middleware.authenticateToken, Controller.Update);
router.delete('/:id', middleware.authenticateToken, Controller.Remove);
router.get('/:id', middleware.authenticateToken, Controller.View);
router.patch('/wallet/:id', middleware.authenticateToken, Controller.walletOTP);
router.patch('/updatepassword/:id', middleware.authenticateToken, Controller.updatePassword);
router.patch('/wallet/update/:id', middleware.authenticateToken, Controller.updateWallet);
router.patch('/block/:id', middleware.authenticateToken, Controller.blockUser);

module.exports = router;