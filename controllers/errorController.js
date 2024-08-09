const apiError = require('./../utils/apiErrors');

const handleCastErrorDB = (err) => {
  message = `Invalid ${err.path}: ${err.value} `;
  return new apiError(message, 400);
};

const handleJWTError = (err) =>
  new apiError('Invalid token! Please login.', 401);

const handleJWTExpireError = (err) =>
  new apiError('Your token has expired. Please login again.', 401);

const handleValidationError = (err) => {
  const errors = Object.values(err.errors).map((el) => el.message);
  message = `Invalid data ${errors.join('. ')}.`;
  return new apiError(message, 400);
};

const sendDevError = (err, req, res) => {
  if (req.originalUrl.startsWith('/api')) {
    return res.status(err.statusCode).json({
      status: err.status,
      error: err,
      message: err.message,
      stack: err.stack,
    });
  }
  console.error('Error💥', err);
  return res.status(err.statusCode).render('error', {
    title: 'Something went wrong',
    msg: err.message,
  });
};

const sendProdError = (err, req, res) => {
  if (req.originalUrl.startsWith('/api')) {
    if (err.isOperational) {
      return res.status(err.statusCode).json({
        status: err.status,
        message: err.message,
      });
    }
    console.error('Error💥', err);

    return res.status(500).json({
      status: err.status,
      message: 'Something Went Wrong!',
    });
  }
  // B)Render Website
  if (err.isOperational) {
    return res.status(err.statusCode).render('error', {
      title: 'Something went wrong',
      msg: err.message,
    });
  }
  console.error('Error💥', err);

  return res.status(err.statusCode).json({
    status: err.status,
    message: 'Please try again later!',
  });
};

module.exports = (err, req, res, next) => {
  err.statusCode = err.statusCode || 500;
  err.status = err.status || 'error';
  if (process.env.NODE_ENV === 'developement') {
    sendDevError(err, req, res);
  } else if (process.env.NODE_ENV === 'production') {
    let error = { ...err };
    error.message = err.message;
    if (error.name === 'CastError') error = handleCastErrorDB(error);
    if (error.name === 'ValidationError') error = handleValidationError(error);
    if (error.name === 'JsonWebTokenError') error = handleJWTError(error);
    if (error.name === 'TokenExpiredError') error = handleJWTExpireError(error);
    sendProdError(error, req, res);
  }
};
