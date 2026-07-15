const Leave = require('../models/Leave');
const User = require('../models/User');

// ─────────────────────────────────────────
// EMPLOYEE: Submit a leave request
// ─────────────────────────────────────────
const applyLeave = async (req, res) => {
  try {
    const { leaveType, startDate, endDate, reason } = req.body;

    if (!leaveType || !startDate || !endDate || !reason) {
      return res.status(400).json({ success: false, message: 'All fields are required.' });
    }

    const start = new Date(startDate);
    const end = new Date(endDate);

    if (end < start) {
      return res.status(400).json({ success: false, message: 'End date cannot be before start date.' });
    }

    const leave = await Leave.create({
      employee: req.user._id,
      leaveType,
      startDate: start,
      endDate: end,
      reason,
    });

    const populated = await leave.populate('employee', 'name email designation');

    res.status(201).json({ success: true, message: 'Leave request submitted successfully.', data: populated });
  } catch (error) {
    console.error('applyLeave error:', error);
    res.status(500).json({ success: false, message: 'Server error.' });
  }
};

// ─────────────────────────────────────────
// EMPLOYEE: Get own leave history
// ─────────────────────────────────────────
const getMyLeaves = async (req, res) => {
  try {
    const leaves = await Leave.find({ employee: req.user._id })
      .populate('reviewedBy', 'name role')
      .sort({ createdAt: -1 });

    res.status(200).json({ success: true, data: leaves });
  } catch (error) {
    console.error('getMyLeaves error:', error);
    res.status(500).json({ success: false, message: 'Server error.' });
  }
};

// ─────────────────────────────────────────
// EMPLOYEE: Cancel a pending leave
// ─────────────────────────────────────────
const cancelLeave = async (req, res) => {
  try {
    const leave = await Leave.findOne({ _id: req.params.id, employee: req.user._id });

    if (!leave) {
      return res.status(404).json({ success: false, message: 'Leave not found.' });
    }

    if (leave.status !== 'pending') {
      return res.status(400).json({ success: false, message: 'Only pending leaves can be cancelled.' });
    }

    await Leave.findByIdAndDelete(req.params.id);

    res.status(200).json({ success: true, message: 'Leave request cancelled.' });
  } catch (error) {
    console.error('cancelLeave error:', error);
    res.status(500).json({ success: false, message: 'Server error.' });
  }
};

// ─────────────────────────────────────────
// HR/ADMIN: Get all leave requests
// ─────────────────────────────────────────
const getAllLeaves = async (req, res) => {
  try {
    const { status, employeeId } = req.query;

    const filter = {};
    if (status) filter.status = status;
    if (employeeId) filter.employee = employeeId;

    const leaves = await Leave.find(filter)
      .populate('employee', 'name email designation department')
      .populate('reviewedBy', 'name role')
      .sort({ createdAt: -1 });

    res.status(200).json({ success: true, data: leaves });
  } catch (error) {
    console.error('getAllLeaves error:', error);
    res.status(500).json({ success: false, message: 'Server error.' });
  }
};

// ─────────────────────────────────────────
// HR/ADMIN: Approve or Reject a leave
// ─────────────────────────────────────────
const reviewLeave = async (req, res) => {
  try {
    const { status, hrComment } = req.body;

    if (!['approved', 'rejected'].includes(status)) {
      return res.status(400).json({ success: false, message: 'Invalid status. Must be approved or rejected.' });
    }

    const leave = await Leave.findById(req.params.id);

    if (!leave) {
      return res.status(404).json({ success: false, message: 'Leave request not found.' });
    }

    if (leave.status !== 'pending') {
      return res.status(400).json({ success: false, message: 'This leave has already been reviewed.' });
    }

    leave.status = status;
    leave.reviewedBy = req.user._id;
    leave.reviewedAt = new Date();
    leave.hrComment = hrComment || '';

    await leave.save();

    const populated = await leave.populate([
      { path: 'employee', select: 'name email designation' },
      { path: 'reviewedBy', select: 'name role' },
    ]);

    res.status(200).json({ success: true, message: `Leave ${status} successfully.`, data: populated });
  } catch (error) {
    console.error('reviewLeave error:', error);
    res.status(500).json({ success: false, message: 'Server error.' });
  }
};

// ─────────────────────────────────────────
// HR/ADMIN: Get Leave Summary per Employee
// ─────────────────────────────────────────
const getLeaveSummary = async (req, res) => {
  try {
    const summary = await Leave.aggregate([
      { $match: { status: 'approved' } },
      {
        $group: {
          _id: '$employee',
          totalApprovedDays: { $sum: '$totalDays' },
          leaveCount: { $count: {} },
          byType: {
            $push: {
              leaveType: '$leaveType',
              totalDays: '$totalDays',
            },
          },
        },
      },
      {
        $lookup: {
          from: 'users',
          localField: '_id',
          foreignField: '_id',
          as: 'employeeInfo',
        },
      },
      { $unwind: '$employeeInfo' },
      {
        $project: {
          _id: 0,
          employee: {
            _id: '$employeeInfo._id',
            name: '$employeeInfo.name',
            email: '$employeeInfo.email',
            designation: '$employeeInfo.designation',
          },
          totalApprovedDays: 1,
          leaveCount: 1,
          byType: 1,
        },
      },
      { $sort: { totalApprovedDays: -1 } },
    ]);

    // Also fetch all leaves for full listing
    const allLeaves = await Leave.find({ status: 'approved' })
      .populate('employee', 'name email designation')
      .sort({ startDate: -1 });

    res.status(200).json({ success: true, data: { summary, allLeaves } });
  } catch (error) {
    console.error('getLeaveSummary error:', error);
    res.status(500).json({ success: false, message: 'Server error.' });
  }
};

module.exports = {
  applyLeave,
  getMyLeaves,
  cancelLeave,
  getAllLeaves,
  reviewLeave,
  getLeaveSummary,
};
