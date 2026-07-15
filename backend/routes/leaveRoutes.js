const express = require('express');
const {
  applyLeave,
  getMyLeaves,
  cancelLeave,
  getAllLeaves,
  reviewLeave,
  getLeaveSummary,
} = require('../controllers/leaveController');
const { protect, verified, authorize } = require('../middleware/authMiddleware');

const router = express.Router();

// All routes require authentication and verified email
router.use(protect);
router.use(verified);

// ── Employee Routes ──────────────────────────────────────
// POST   /api/leaves/apply       → Apply for leave
// GET    /api/leaves/my          → Get own leave history
// DELETE /api/leaves/:id/cancel  → Cancel a pending leave

router.post('/apply', applyLeave);
router.get('/my', getMyLeaves);
router.delete('/:id/cancel', cancelLeave);

// ── HR / Admin Routes ────────────────────────────────────
// GET  /api/leaves/all           → Get all leave requests (filterable)
// GET  /api/leaves/summary       → Leave summary per employee
// PUT  /api/leaves/:id/review    → Approve or Reject a leave

router.get('/all', authorize('admin', 'hr'), getAllLeaves);
router.get('/summary', authorize('admin', 'hr'), getLeaveSummary);
router.put('/:id/review', authorize('admin', 'hr'), reviewLeave);

module.exports = router;
