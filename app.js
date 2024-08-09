const path = require('path');
const exp = require('constants');
const express = require('express');
const helmet = require('helmet');
const { stat } = require('fs/promises');
const mongoSanitize = require('express-mongo-sanitize');
const xss = require('xss-clean');
const hpp = require('hpp');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');
const tourRouter = require('./routes/tour-Routes.js');
const userRouter = require('./routes/user-Routes.js');
const reveiwRouter = require('./routes/reveiw-Routes.js');
const bookingRouter = require('./routes/booking-Routes.js');
const globalErrorHandler = require('./controllers/errorController.js');
const apiError = require('./utils/apiErrors.js');
const viewRouter = require('./routes/view-Routes.js');
const cookieParser = require('cookie-parser');

const app = express();

app.set('view engine', 'pug');
app.set('views', path.join(__dirname, 'views'));

// 5) Serving static files
app.use(express.static(path.join(__dirname, 'public')));

//Global Middleware
// 1) security Http header miidlware
app.use(helmet());

// 2) Developement logging
console.log(process.env.NODE_ENV);
if (process.env.NODE_ENV === 'developement') {
  app.use(morgan('dev'));
}
// 3) limiting requests from same ip adresss
const limiter = rateLimit({
  max: 100,
  windowMs: 60 * 60 * 1000,
  message: 'Too many requests from this Ip. Please try again in an hour!',
});
app.use('/api', limiter);
// 4) Body parser, reading data into req.body
app.use(express.json({ limit: '10kb' }));
app.use(cookieParser());
// 6) Data sanitazion againt No sql query injection
app.use(mongoSanitize());
//7) Data sanitazion against XSS
app.use(xss());

app.use(
  hpp({
    whitelist: [
      'duration',
      'ratingsQuantity',
      'ratingsAverage',
      'maxGroupSize',
      'difficulty',
      'price',
    ],
  })
);
// 6) Creating time stamp for request
app.use((req, res, next) => {
  req.requestTime = new Date().toISOString();
  console.log(req.cookies);
  next();
});

app.use('/', viewRouter);
app.use('/api/v1/tours', tourRouter);
app.use('/api/v1/users', userRouter);
app.use('/api/v1/reveiws', reveiwRouter);
app.use('/api/v1/booking', bookingRouter);

app.all('*', (req, res, next) => {
  // res.status(404).json({
  //   status: 'failed',
  //   message: `Page with ${req.originalUrl} not found on this server!`,
  // });
  // const err = new Error(`Cant find ${req.originalUrl} on this server!`);
  // err.statusCode = 404;
  // err.status = 'failed';
  next(new apiError(`Cant find ${req.originalUrl} on this server!`, 404));
});

app.use(globalErrorHandler);

module.exports = app;
