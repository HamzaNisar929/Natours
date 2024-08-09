const express = require('express');
const reveiwController = require('./../controllers/reveiwController');
const authController = require('./../controllers/authController');

const router = express.Router({ mergeParams: true });

router.use(authController.protected);
router.get('/', reveiwController.getAllReveiws);
router.post(
  '/',
  authController.restrictTo('user'),
  reveiwController.createReveiw
);
router
  .route('/:id')
  .get(authController.restrictTo('admin', 'user'), reveiwController.getReveiw)
  .patch(
    authController.restrictTo('admin', 'user'),
    reveiwController.updateReveiw
  )
  .delete(
    authController.restrictTo('admin', 'user'),
    reveiwController.deleteReveiw
  );

module.exports = router;
