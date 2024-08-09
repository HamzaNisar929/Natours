const express = require('express');
const tourController = require('../controllers/tours-controller.js');
const authController = require('./../controllers/authController.js');
const reveiwController = require('./../controllers/reveiwController');

const router = express.Router();

router.get('/:tourid/reveiws', reveiwController.getReveiw);

router
  .route('/top-5-cheap-tours')
  .get(tourController.alliaceTopTours, tourController.getAllTours);

router
  .route('/tours-within/:distance/center/:latlng/unit/:unit')
  .get(tourController.getToursWithin);

router
  .route('/distances/:latlng/unit/:unit')
  .get(tourController.getToursNearMe);

router.route('/tour-stats').get(tourController.getTourStats);

router
  .route('/')
  .get(tourController.getAllTours)
  .post(
    authController.protected,
    authController.restrictTo('admin'),
    tourController.createTour
  );

router
  .route('/:id')
  .get(tourController.getTour)
  .patch(
    authController.protected,
    authController.restrictTo('admin'),
    tourController.uploadTourImages,
    tourController.resizeTourImages,
    tourController.updateTour
  )
  .delete(
    authController.protected,
    authController.restrictTo('admin'),
    tourController.deleteTour
  );

module.exports = router;
