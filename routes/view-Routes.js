const express = require('express');
const viewController = require('./../controllers/viewController.js');
const authController = require('./../controllers/authController.js');
const bookingController = require('../controllers/bookingController.js');

const router = express.Router();

router.get(
  '/',
  bookingController.createBookingCheckout,
  authController.isLoggedIn,
  viewController.getOverview
);
router.get('/tour/:slug', authController.isLoggedIn, viewController.getTour);
router.get('/login', authController.isLoggedIn, viewController.getLogin);
router.get('/me', authController.protected, viewController.getAccount);
router.get('/getMyTours', authController.protected, viewController.getMyTours);
module.exports = router;
