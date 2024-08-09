const Tour = require('../models/tourModel');
const catchAsync = require('../utils/catchAsync');
const apiError = require('./../utils/apiErrors');
const Booking = require('../models/bookingModel');

exports.getOverview = catchAsync(async (req, res, next) => {
  // 1) Get Data  from db
  const tours = await Tour.find();

  res.status(200).render('overview', {
    title: 'Home',
    tours,
  });
});

exports.getTour = catchAsync(async (req, res, next) => {
  // 1) Get data including reviews and guides
  const tour = await Tour.findOne({ slug: req.params.slug }).populate({
    path: 'reveiws',
    select: 'reveiw rating user',
  });

  if (!tour) {
    return next(new apiError('There is not tour with this name', 404));
  }
  // 2) Build Template

  // 3) Send response with data
  res.status(200).render('tour', {
    title: tour.name,
    tour,
  });
});

exports.getLogin = catchAsync(async (req, res) => {
  res.status(200).render('login', {
    title: 'Login',
  });
});

exports.getAccount = (req, res) => {
  res.status(200).render('account', {
    title: 'Your account',
  });
};

exports.getMyTours = catchAsync(async (req, res, next) => {
  // 1) Find bookings of user
  const bookings = await Booking.find({ user: req.user.id });
  // 2) Find tour based on bookings
  const tourIDs = bookings.map((el) => el.tour);
  const tours = await Tour.find({ _id: { $in: tourIDs } });

  res.status(200).render('overview', {
    title: 'My tours',
    tours,
  });
});
