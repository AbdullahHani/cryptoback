const express = require('express');
const adminModel = require('../Admin/model');

const router = express.Router();

router.post('/login', async (req, res, next) => {
    try {
        let { email, password } = req.body;
        let admin = {};
        admin = await adminModel.findOne({email: email});
        if (!admin) {
            res.redirect('/');
        }
        else {
            let isMatch = await admin.comparePassword(password);
            if ( !isMatch ) {
                res.redirect('/');
            }
            else {
                req.session.token = admin.token;
                res.redirect('/admin/schedule');
            }
        }
    } catch (error) {
        res.redirect('/');
    }
});

module.exports = router;