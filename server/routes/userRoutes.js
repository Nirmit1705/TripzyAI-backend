const express = require('express');
const router = express.Router();
const {
  registerUser,
  loginUser,
  getUserProfile,
  getTripHistory,
  getCurrentTrips,
  getTravelStats,
  rateTripAndReview
} = require('../controllers/userController');
const { protect } = require('../middlewares/authMiddleware');

router.post('/register', registerUser);
router.post('/login', loginUser);
router.route('/profile').get(protect, getUserProfile);
router.get('/trip-history', protect, getTripHistory);
router.get('/current-trips', protect, getCurrentTrips);
router.get('/travel-stats', protect, getTravelStats);
router.put('/rate-trip/:id', protect, rateTripAndReview);

module.exports = router;
