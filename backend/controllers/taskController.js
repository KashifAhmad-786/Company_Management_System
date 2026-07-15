const Task = require('../models/Task');
const User = require('../models/User');

// Create a new task (Manager / Admin / HR)
const createTask = async (req, res, next) => {
  try {
    const { title, description, assignedTo, priority, deadline } = req.body;

    // Verify employee exists and is active
    const employee = await User.findById(assignedTo);
    if (!employee || employee.status !== 'active') {
      return res.status(404).json({ success: false, message: 'Active employee not found' });
    }

    const task = new Task({
      title,
      description,
      assignedTo,
      assignedBy: req.user._id,
      priority,
      deadline,
      status: 'todo',
      history: [{
        status: 'todo',
        changedAt: Date.now(),
        changedBy: req.user._id
      }]
    });

    await task.save();

    res.status(201).json({
      success: true,
      message: 'Task created and assigned successfully',
      task
    });
  } catch (error) {
    next(error);
  }
};

// Get tasks list (Role specific filtering)
const getTasks = async (req, res, next) => {
  try {
    let query = {};

    if (req.user.role === 'employee') {
      // Employee sees only their own tasks
      query = { assignedTo: req.user._id };
    } else if (req.user.role === 'manager') {
      // Managers see tasks they assigned OR tasks assigned to members of their department/team
      // For flexibility, return tasks assigned by this manager, or all tasks if we want broader tracking.
      // Let's filter: either assignedBy them or assignedTo team members.
      query = { 
        $or: [
          { assignedBy: req.user._id },
          // Option to view all tasks in their department
          { department: req.user.department }
        ]
      };
    }
    // Admin and HR see all tasks

    const tasks = await Task.find(query)
      .populate('assignedTo', 'name email designation department')
      .populate('assignedBy', 'name email role')
      .sort({ createdAt: -1 });

    // Inject "isOverdue" flag dynamically
    const processedTasks = tasks.map(task => {
      const isOverdue = task.status !== 'done' && new Date(task.deadline) < new Date();
      return {
        ...task.toObject(),
        isOverdue
      };
    });

    res.status(200).json({
      success: true,
      count: processedTasks.length,
      tasks: processedTasks
    });
  } catch (error) {
    next(error);
  }
};

// Get single task by ID
const getTaskById = async (req, res, next) => {
  try {
    const task = await Task.findById(req.params.id)
      .populate('assignedTo', 'name email designation status')
      .populate('assignedBy', 'name email role')
      .populate('history.changedBy', 'name role');

    if (!task) {
      return res.status(404).json({ success: false, message: 'Task not found' });
    }

    // Access control check
    if (req.user.role === 'employee' && task.assignedTo._id.toString() !== req.user._id.toString()) {
      return res.status(403).json({ success: false, message: 'Not authorized to view this task' });
    }

    const isOverdue = task.status !== 'done' && new Date(task.deadline) < new Date();
    const taskData = {
      ...task.toObject(),
      isOverdue
    };

    res.status(200).json({
      success: true,
      task: taskData
    });
  } catch (error) {
    next(error);
  }
};

// Update task status (Employee updates own task; Manager/Admin can update any task)
const updateTaskStatus = async (req, res, next) => {
  try {
    const { status } = req.body;
    
    if (!['todo', 'inprogress', 'done'].includes(status)) {
      return res.status(400).json({ success: false, message: 'Invalid status value' });
    }

    const task = await Task.findById(req.params.id);
    if (!task) {
      return res.status(404).json({ success: false, message: 'Task not found' });
    }

    // Role verification
    if (req.user.role === 'employee' && task.assignedTo.toString() !== req.user._id.toString()) {
      return res.status(403).json({ success: false, message: 'Not authorized to update status for this task' });
    }

    // Add status history entry
    task.status = status;
    task.history.push({
      status,
      changedAt: Date.now(),
      changedBy: req.user._id
    });

    await task.save();

    res.status(200).json({
      success: true,
      message: 'Task status updated successfully',
      task
    });
  } catch (error) {
    next(error);
  }
};

// Edit full task parameters (Manager / Admin / HR only)
const updateTask = async (req, res, next) => {
  try {
    const { title, description, assignedTo, priority, deadline, status } = req.body;

    const task = await Task.findById(req.params.id);
    if (!task) {
      return res.status(404).json({ success: false, message: 'Task not found' });
    }

    // Check if manager is editing someone else's task that they didn't assign
    if (req.user.role === 'manager' && task.assignedBy.toString() !== req.user._id.toString()) {
      return res.status(403).json({ success: false, message: 'Not authorized to edit tasks assigned by other managers' });
    }

    if (assignedTo) {
      const employee = await User.findById(assignedTo);
      if (!employee || employee.status !== 'active') {
        return res.status(400).json({ success: false, message: 'Active employee not found' });
      }
      task.assignedTo = assignedTo;
    }

    if (title) task.title = title;
    if (description) task.description = description;
    if (priority) task.priority = priority;
    if (deadline) task.deadline = deadline;

    if (status && status !== task.status) {
      task.status = status;
      task.history.push({
        status,
        changedAt: Date.now(),
        changedBy: req.user._id
      });
    }

    await task.save();

    res.status(200).json({
      success: true,
      message: 'Task updated successfully',
      task
    });
  } catch (error) {
    next(error);
  }
};

// Delete a task (Manager / Admin / HR only)
const deleteTask = async (req, res, next) => {
  try {
    const task = await Task.findById(req.params.id);
    if (!task) {
      return res.status(404).json({ success: false, message: 'Task not found' });
    }

    // Only allow managers to delete their own assigned tasks
    if (req.user.role === 'manager' && task.assignedBy.toString() !== req.user._id.toString()) {
      return res.status(403).json({ success: false, message: 'Not authorized to delete tasks assigned by others' });
    }

    await Task.findByIdAndDelete(req.params.id);

    res.status(200).json({
      success: true,
      message: 'Task deleted successfully'
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  createTask,
  getTasks,
  getTaskById,
  updateTaskStatus,
  updateTask,
  deleteTask
};
