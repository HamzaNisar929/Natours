const catchAsync = require('./../utils/catchAsync');
const apiError = require('./../utils/apiErrors');
const APIfeatures = require('../utils/apiFeatures');

exports.deleteOne = (Model) =>
  catchAsync(async (req, res, next) => {
    const doc = await Model.findByIdAndDelete(req.params.id);

    if (!doc) {
      return next(
        new apiError(
          `Could not find document with this id ${req.params.id}`,
          404
        )
      );
    }

    res.status(204).json({
      status: 'success',
      data: null,
    });
  });

exports.updateOne = (Model) =>
  catchAsync(async (req, res, next) => {
    const doc = await Model.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    });

    if (!doc) {
      return next(
        new apiError(
          `Could not find document with this id ${req.params.id}`,
          404
        )
      );
    }

    res.status(200).json({
      status: 'success',
      data: {
        data: doc,
      },
    });
  });

exports.getOne = (Model) =>
  catchAsync(async (req, res, next) => {
    let query = Model.findById(req.params.id);
    const doc = await query;

    if (!doc) {
      return next(
        new apiError(
          `Could not find documents with this id ${req.params.id}`,
          404
        )
      );
    }

    res.status(200).json({
      status: 'success',
      data: {
        data: doc,
      },
    });
  });

exports.getAll = (Model) =>
  catchAsync(async (req, res, next) => {
    let filter = {};
    if (req.params.tourid) filter = { tour: req.params.tourid };
    const features = new APIfeatures(Model.find(filter), req.query)
      .filter()
      .sorting()
      .selectingFeilds()
      .pagination();
    //explaining indexes
    // const doc = await features.query.explain();
    const doc = await features.query;
    res.status(200).json({
      status: 'success',
      result: doc.length,
      requestAt: req.requestTime,
      data: {
        data: doc,
      },
    });
  });
