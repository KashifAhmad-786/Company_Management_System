const express = require('express');
const {
  submitReport,
  getReports,
  reviewReport
} = require('../controllers/reportController');
const { protect, verified, authorize } = require('../middleware/authMiddleware');
const { validateReportCreate } = require('../utils/validation');

const router = express.Router();

router.use(protect);
router.use(verified);

router.post('/', authorize('employee'), validateReportCreate, submitReport);
router.get('/', getReports);
router.put('/:id/review', authorize('admin', 'hr', 'manager'), reviewReport);

module.exports = router;
