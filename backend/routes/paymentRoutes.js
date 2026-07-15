const express = require('express');
const {
  initiateSalaryPayout,
  getPaymentHistory
} = require('../controllers/paymentController');
const { protect, verified, authorize } = require('../middleware/authMiddleware');

const router = express.Router();

router.use(protect);
router.use(verified);

router.post('/payout', authorize('admin', 'hr'), initiateSalaryPayout);
router.get('/history', getPaymentHistory);

module.exports = router;
