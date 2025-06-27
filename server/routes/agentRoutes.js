const express = require('express');
const router = express.Router();
const {
  chatWithAgent,
  updateItinerary
} = require('../controllers/agentController');
const { protect } = require('../middlewares/authMiddleware');

router.route('/chat').post(protect, chatWithAgent);
router.route('/update').post(protect, updateItinerary);

module.exports = router;
