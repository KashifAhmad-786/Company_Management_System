const express = require('express');
const {
  createTask,
  getTasks,
  getTaskById,
  updateTaskStatus,
  updateTask,
  deleteTask
} = require('../controllers/taskController');
const { protect, verified, authorize } = require('../middleware/authMiddleware');
const { validateTaskCreate } = require('../utils/validation');

const router = express.Router();

router.use(protect);
router.use(verified);

router.post('/', authorize('admin', 'hr', 'manager'), validateTaskCreate, createTask);
router.get('/', getTasks);
router.get('/:id', getTaskById);
router.put('/:id/status', updateTaskStatus);
router.put('/:id', authorize('admin', 'hr', 'manager'), updateTask);
router.delete('/:id', authorize('admin', 'hr', 'manager'), deleteTask);

module.exports = router;
