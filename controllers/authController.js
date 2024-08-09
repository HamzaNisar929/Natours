const jwt = require('jsonwebtoken');
const User = require('./../models/userModel');
const catchAsync = require('./../utils/catchAsync');
const apiError = require('./../utils/apiErrors');
const { promisify } = require('util');
const { decode } = require('punycode');
const Email = require('./../utils/Email');
const crypto = require('crypto');

const createJWT = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES,
  });
};

const createSendJWT = (user, res, statusCode) => {
  const token = createJWT(user._id);
  const cookieOptions = {
    expires: new Date(
      Date.now() + process.env.JWT_COOKIE_EXPIRES * 24 * 60 * 60 * 1000
    ),
    httpOnly: true,
  };
  user.password = undefined;
  if (process.env.NODE_ENV === 'production') {
    cookieOptions.secure = true;
  }
  res.cookie('jwt', token, cookieOptions);

  res.status(statusCode).json({
    status: 'success',
    token,
    data: {
      user,
    },
  });
};

exports.signUp = catchAsync(async (req, res, next) => {
  const newUser = await User.create({
    name: req.body.name,
    email: req.body.email,
    password: req.body.password,
    passwordConfirm: req.body.passwordConfirm,
    role: req.body.role,
  });

  const url = `${req.protocol}://${req.get('host')}/me`;
  await new Email(newUser, url).sendWelcome();

  createSendJWT(newUser, res, 201);
});

exports.logIn = catchAsync(async (req, res, next) => {
  const { email, password } = req.body;
  // 1) If email and pwd exists
  if (!email || !password) {
    return next(new apiError('Please provide an email and a password!', 400));
  }
  // 2) Check if the user with input credentials exist
  const user = await User.findOne({ email }).select('+password');

  if (!email || !(await user.correctPassword(password, user.password))) {
    return next(new apiError('Incorrect username or password!', 401));
  }

  // 3) If all correct then send token to client
  createSendJWT(user, res, 200);
});

exports.protected = catchAsync(async (req, res, next) => {
  let token;
  // 1) If token exists
  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith('Bearer')
  ) {
    token = req.headers.authorization.split(' ')[1];
  } else if (req.cookies.jwt) {
    token = req.cookies.jwt;
  }
  console.log(token);

  if (!token) {
    return next(
      new apiError('You are  not logged in. Please login first!', 401)
    );
  }

  // 2) verfify the token
  const decoded = await promisify(jwt.verify)(token, process.env.JWT_SECRET);
  console.log(decoded);
  // 3) Check if the user still exists
  const freshUser = await User.findById(decoded.id);
  if (!freshUser) {
    return next(
      new apiError('The user belonging to this token no more exists', 404)
    );
  }
  // 4) Check if the user changed passwords after receiving token
  if (freshUser.changedPasswordAfter(decoded.iat)) {
    return next(
      new apiError('User recently changed pwd.Plaese login again!', 401)
    );
  }

  req.user = freshUser;
  res.locals.user = freshUser;
  console.log(req.user);
  next();
});

exports.isLoggedIn = async (req, res, next) => {
  if (req.cookies.jwt) {
    try {
      // 2) verfify the token
      const decoded = await promisify(jwt.verify)(
        req.cookies.jwt,
        process.env.JWT_SECRET
      );
      // 3) Check if the user still exists
      const freshUser = await User.findById(decoded.id);
      if (!freshUser) {
        return next();
      }
      // 4) Check if the user changed passwords after receiving token
      if (freshUser.changedPasswordAfter(decoded.iat)) {
        return next(
          new apiError('User recently changed pwd.Plaese login again!', 401)
        );
      }
      res.locals.user = freshUser;
      return next();
    } catch (err) {
      return next();
    }
  }
  next();
};

exports.logout = (req, res) => {
  res.cookie('jwt', 'logged out', {
    expires: new Date(Date.now() + 10 * 1000),
    httpOnly: true,
  });
  res.status(200).json({ status: 'success' });
};

exports.restrictTo = (...role) => {
  return (req, res, next) => {
    if (!role.includes(req.user.role)) {
      return next(
        new apiError('You are not allowed to perform this task', 403)
      );
    }

    next();
  };
};

exports.forgotPassword = catchAsync(async (req, res, next) => {
  // 1) Get user email and check if it exists
  const user = await User.findOne({ email: req.body.email });
  if (!user) {
    return next(new apiError('No user exist with this email', 404));
  }
  // 2) Create a reset Token which will be then sent to user
  const resetToken = user.createResetToken();
  console.log(resetToken);
  await user.save({ validateBeforeSave: false });

  //3)Send it to users email
  const resetURL = `${req.protocol}://${req.get(
    'host'
  )}/api/v1/users/resetPassword/${resetToken}`;

  const message = `Forgot your password? Dont worry send a patch request to this link and reset your pwd ${resetURL}. \n If you didnot forgot ur pwd please ignore this mail.`;

  try {
    // await sendEmail({
    //   email: user.email,
    //   subject: 'Reset your password (valid till 10 min)',
    //   message,
    // });

    console.log('hi');
    res.status(200).json({
      status: 'success',
      message: 'Token sent to email successfully!',
    });
  } catch (err) {
    console.log(err.message);
    user.passwordResetToken = undefined;
    user.passResetExpires = undefined;
    await user.save({ validateBeforeSave: false });
    return next(
      new apiError('Failed to sent email. Please try again later!', 500)
    );
  }
});

exports.resetPassword = catchAsync(async (req, res, next) => {
  // 1) Get a user based on token
  const hashedResetToken = crypto
    .createHash('sha256')
    .update(req.params.token)
    .digest('hex');

  const user = await User.findOne({
    passwordResetToken: hashedResetToken,
    passResetExpires: { $gt: Date.now() },
  });

  // 2) if the user exists set the new password
  if (!user) {
    return next(new apiError('Token is invalid or expired', 400));
  }
  user.password = req.body.password;
  user.passwordConfirm = req.body.passwordConfirm;
  user.passwordResetToken = undefined;
  user.passResetExpires = undefined;
  await user.save();

  // 3) Update the userpasswordat()

  // 4) Login the user and ssign jwt
  createSendJWT(user, res, 201);
});

exports.updatePassword = catchAsync(async (req, res, next) => {
  // 1) Get the user based on pwd
  const user = await User.findById(req.user.id).select('+password');
  // 2) if the entered pwd is correct
  if (!(await user.correctPassword(req.body.passwordCurrent, user.password))) {
    return next(
      new apiError('Entered password does not match the original password', 401)
    );
  }

  user.password = req.body.password;
  user.passwordConfirm = req.body.password;
  await user.save();
  // 4) update pwd create a jwt token
  createSendJWT(user, res, 201);
});
