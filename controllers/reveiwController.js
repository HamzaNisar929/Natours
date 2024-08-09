const Reveiw = require('./../models/reveiwModel');
const APIfeatures = require('./../utils/apiFeatures.js');
const catchAsync = require('./../utils/catchAsync.js');
const apiError = require('./../utils/apiErrors.js');
const factory = require('./../controllers/factoryController.js');

exports.getAllReveiws = factory.getAll(Reveiw);

exports.createReveiw = catchAsync(async (req, res, next) => {
  if (!req.body.tour) req.body.tour = req.params.tourid;
  if (!req.body.users) req.body.users = req.user.id;
  const newReveiw = await Reveiw.create(req.body);

  if (!newReveiw) {
    return next(
      new apiError('No feilds found! Please fill in the feilds', 404)
    );
  }

  res.status(201).json({
    status: 'success',
    data: {
      newReveiw,
    },
  });
});

exports.getReveiw = factory.getOne(Reveiw);
exports.deleteReveiw = factory.deleteOne(Reveiw);
exports.updateReveiw = factory.updateOne(Reveiw);
