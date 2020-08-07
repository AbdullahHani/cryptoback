const jwt = require('jsonwebtoken');
const environment = require('dotenv');
// const crypto = require('crypto');
const adminModel = require('../App/Admin/model');
environment.config;

const authenticateToken = (req, res, next) => {
  let token = req.headers['x-access-token'] || req.headers['authorization']; // Express headers are auto converted to lowercase
  if (token && token.startsWith('Bearer ')) {
    // Remove Bearer from string
    token = token.slice(7, token.length);
  }

  if (token) {
    jwt.verify(token, process.env.TOKEN_SECRET, (err, decoded) => {
      if (err) {
        return res.json({
          success: false,
          message: 'Token is not valid'
        });
      } else {
        req.decoded = decoded;
        next();
      }
    });
  } else {
    return res.json({
      success: false,
      message: 'Auth token is not supplied'
    });
  }
};

// const webhookVerification = async (req, res, next) => {
//   const hmac = req.headers['x-shopify-hmac-sha256'];
//   // const body =  await getRawBody(req);

//   const hash = crypto
//     .createHmac('sha256', process.env.SHOPIFY_WEBHOOK_SECRET)
//     .update(req.rawBody, 'utf8', 'hex')
//     .digest('base64')

//     if (hash === hmac) {
//       next();
//     } else {
//       // No match! This request didn't originate from Shopify
//       console.log('Danger! Not from Shopify!')
//       res.sendStatus(403)
//     }
// };

const adminAuthentication = async ( req, res, next ) => {
  const token = req.session.token;
  if ( !token ) {
    res.redirect('/');
  }
  else {
    const adminExist = await adminModel.findOne({token: token});
    if ( !adminExist ) {
      res.redirect('/');
    }
    else {
      next();
    }
  }
}

module.exports = {
    authenticateToken,
    adminAuthentication
}