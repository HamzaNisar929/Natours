const mongoose = require('mongoose');
const Tour = require('./tourModel');

const reveiwSchema = new mongoose.Schema(
  {
    reveiw: {
      type: String,
      required: [true, 'A reveiw must have a text'],
    },
    rating: {
      type: Number,
      required: [true, 'A reveiw must have a rating'],
      min: 1,
      max: 5,
      default: 4.5,
    },
    createdAt: {
      type: Date,
      default: Date.now(),
    },
    tour: {
      type: mongoose.Schema.ObjectId,
      ref: 'Tour',
      required: [true, 'A reveiw must belong to a tour'],
    },
    users: {
      type: mongoose.Schema.ObjectId,
      ref: 'User',
      required: [true, 'A reveiw must belong to a user'],
    },
  },
  {
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

reveiwSchema.index({ tour: 1, user: 1 }, { unique: true });

// Query Middleware
reveiwSchema.pre(/^find/, function (next) {
  this.populate({
    path: 'users',
  });
  next();
});
// reveiwSchema.pre(/^find/, function (next) {
//   this.populate({
//     path: 'tour',
//     select: 'name -guides',
//   });
//   next();
// });

//Using static method bcz in statics method this points to model
reveiwSchema.statics.calculateAverageRatings = async function (tourid) {
  const stats = await this.aggregate([
    {
      $match: { tour: tourid },
    },
    {
      $group: {
        _id: '$tour',
        nRatings: { $sum: 1 },
        avgRating: { $avg: '$rating' },
      },
    },
  ]);
  console.log(stats);

  if (stats.length > 0) {
    await Tour.findByIdAndUpdate(tourid, {
      ratingsAverage: stats[0].avgRating,
      ratingsQuantity: stats[0].nRatings,
    });
  } else {
    await Tour.findByIdAndUpdate(tourid, {
      ratingsAverage: 4.5,
      ratingsQuantity: 0,
    });
  }
};

reveiwSchema.post('save', function () {
  //Cannot be used bcz reveiw is not yet created
  // Reveiw.calculateAverageRatings();
  //this points to the model
  this.constructor.calculateAverageRatings(this.tour);
});

reveiwSchema.pre(/^findOneAnd/, async function (next) {
  this.r = await this.findOne();
  next();
});

reveiwSchema.post(/^findOneAnd/, async function () {
  await this.r.constructor.calculateAverageRatings(this.r.tour);
});

const Reveiw = mongoose.model('Reveiw', reveiwSchema);
module.exports = Reveiw;
