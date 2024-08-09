const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const Tour = require('../models/tourModel');
const APIfeatures = require('./../utils/apiFeatures.js');
const catchAsync = require('./../utils/catchAsync.js');
const apiError = require('./../utils/apiErrors.js');
const factory = require('./../controllers/factoryController.js');
const Booking = require('../models/bookingModel.js');

exports.getCheckoutSession = catchAsync(async (req, res, next) => {
  // 1) Find the tour
  const tour = await Tour.findById(req.params.tourId);
  // 2) Create checkout session
  const session = await stripe.checkout.sessions.create({
    payment_method_types: ['card'],
    mode: 'payment',
    success_url: `${req.protocol}://${req.get('host')}/?tour=${
      req.params.tourId
    }&user=${req.user.id}&price=${tour.price}`,
    cancel_url: `${req.protocol}://${req.get('host')}/tour/${tour.slug}`,
    customer_email: req.user.email,
    client_reference_id: req.params.tourId,
    line_items: [
      {
        price_data: {
          currency: 'usd',
          product_data: {
            name: tour.name,
          },
          unit_amount: Math.round(tour.price * 100),
        },
        quantity: 1,
        // // images: [`https://www.natours.dev/img/tours/${tour.imageCover}`],
        // price: tour.price * 100,
        // // currency: 'usd',
        // quantity: 1,
      },
    ],
  });
  // 3) send checkout session to client
  res.status(200).json({
    status: 'success',
    session,
  });
});

exports.createBookingCheckout = catchAsync(async (req, res, next) => {
  const { tour, user, price } = req.query;
  if (!tour || !user || !price) return next();
  await Booking.create({ tour, user, price });

  res.redirect(req.originalUrl.split('?')[0]);
});

exports.createBooking = catchAsync(async (req, res, next) => {
  const { tour, user, price } = req.body;

  const booking = await Booking.create({ tour, user, price });
  if (!booking) {
    return next(new apiError('Error in creating booking', 404));
  }
  res.status(200).json({
    status: 'success',
    booking,
  });
});

exports.getAllBookings = catchAsync(async (req, res, next) => {
  const bookings = await Booking.find({ _id: req.user.id });
  if (!bookings) {
    return next(new apiError('no bookings found', 404));
  }
  res.status(200).json({
    status: 'success',
    bookings,
  });
});

exports.updateBooking = catchAsync(async (req, res, next) => {
  const booking = await Booking.findByIdAndUpdate(req.params.id, req.body, {
    new: true,
    runValidators: true,
  });
  if (!booking) {
    return next(new apiError('no booking found', 404));
  }
  res.status(200).json({
    status: 'success',
    booking,
  });
});

exports.deleteBooking = catchAsync(async (req, res, next) => {
  const booking = await Booking.findByIdAndDelete(req.params.id);
  if (!booking) {
    return next(new apiError('no booking found', 404));
  }
  res.status(200).json({
    status: 'success',
    booking,
  });
});
