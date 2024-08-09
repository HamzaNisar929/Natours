const express = require('express');
const bookingController = require('./../controllers/bookingController');
const authController = require('./../controllers/authController');

const router = express.Router({ mergeParams: true });

router.use(authController.protected);
router.get('/checkout-session/:tourId', bookingController.getCheckoutSession);
router.post('/createBooking', bookingController.createBooking);
router.get('/getAllBookings', bookingController.getAllBookings);
router.patch('/updateBooking/:id', bookingController.updateBooking);
router.delete('deleteBooking/:id', bookingController.deleteBooking);
module.exports = router;
