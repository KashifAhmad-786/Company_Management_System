const Report = require('../models/Report');
const Task = require('../models/Task');
const User = require('../models/User');

// Submit report (Employee only)
const submitReport = async (req, res, next) => {
  try {
    const { task, type, content } = req.body;

    // Verify task exists and belongs to the user (if task is provided)
    if (task) {
      const taskDoc = await Task.findById(task);
      if (!taskDoc) {
        return res.status(404).json({ success: false, message: 'Assigned task not found' });
      }
      if (taskDoc.assignedTo.toString() !== req.user._id.toString()) {
        return res.status(403).json({ success: false, message: 'Cannot submit report for a task not assigned to you' });
      }
    }

    const report = new Report({
      reporter: req.user._id,
      task: task || undefined,
      type,
      content,
      status: 'pending'
    });

    await report.save();

    res.status(201).json({
      success: true,
      message: 'Report submitted successfully',
      report
    });
  } catch (error) {
    next(error);
  }
};

// Get reports list (with dynamic role-based query)
const getReports = async (req, res, next) => {
  try {
    let query = {};

    if (req.user.role === 'employee') {
      query = { reporter: req.user._id };
    } else if (req.user.role === 'manager') {
      // Find all employees in manager's department
      const teamMembers = await User.find({ department: req.user.department });
      const teamMemberIds = teamMembers.map(m => m._id);

      // Find tasks assigned by the manager
      const managerTasks = await Task.find({ assignedBy: req.user._id });
      const managerTaskIds = managerTasks.map(t => t._id);

      query = {
        $or: [
          { reporter: { $in: teamMemberIds } },
          { task: { $in: managerTaskIds } }
        ]
      };
    }
    // Admin / HR see all reports

    const reports = await Report.find(query)
      .populate('reporter', 'name email designation department')
      .populate('task', 'title description status')
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: reports.length,
      reports
    });
  } catch (error) {
    next(error);
  }
};

// Review report - Approve/Reject (Manager/HR/Admin)
const reviewReport = async (req, res, next) => {
  try {
    const { status, feedback } = req.body;

    if (!['approved', 'rejected'].includes(status)) {
      return res.status(400).json({ success: false, message: 'Status must be approved or rejected' });
    }

    const report = await Report.findById(req.params.id)
      .populate('reporter', 'name department');
      
    if (!report) {
      return res.status(404).json({ success: false, message: 'Report not found' });
    }

    // Managers can only review reports of their team members
    if (req.user.role === 'manager') {
      const reporterUser = await User.findById(report.reporter._id);
      
      // If reporter is not in manager's department, check if they are tied to a task assigned by the manager
      let isAssignedByManager = false;
      if (report.task) {
        const taskDoc = await Task.findById(report.task);
        if (taskDoc && taskDoc.assignedBy.toString() === req.user._id.toString()) {
          isAssignedByManager = true;
        }
      }

      const isSameDepartment = reporterUser && reporterUser.department && 
                               reporterUser.department.toString() === req.user.department?.toString();

      if (!isSameDepartment && !isAssignedByManager) {
        return res.status(403).json({ success: false, message: 'Not authorized to review reports outside your team' });
      }
    }

    report.status = status;
    report.feedback = feedback || undefined;
    await report.save();

    res.status(200).json({
      success: true,
      message: `Report ${status} successfully`,
      report
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  submitReport,
  getReports,
  reviewReport
};
