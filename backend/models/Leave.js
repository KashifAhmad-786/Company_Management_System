const mongoose = require('mongoose');

const leaveSchema = new mongoose.Schema({
  employee: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  leaveType: {
    type: String,
    enum: ['sick', 'casual', 'annual', 'unpaid', 'maternity', 'paternity'],
    required: true,
  },
  startDate: {
    type: Date,
    required: true,
  },
  endDate: {
    type: Date,
    required: true,
  },
  totalDays: {
    type: Number,
    required: true,
  },
  reason: {
    type: String,
    required: true,
    trim: true,
    maxlength: 500,
  },
  status: {
    type: String,
    enum: ['pending', 'approved', 'rejected'],
    default: 'pending',
  },
  reviewedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null,
  },
  reviewedAt: {
    type: Date,
    default: null,
  },
  hrComment: {
    type: String,
    trim: true,
    maxlength: 300,
    default: '',
  },
}, { timestamps: true });

// Auto-compute totalDays before saving
leaveSchema.pre('validate', function (next) {
  if (this.startDate && this.endDate) {
    const diffMs = new Date(this.endDate) - new Date(this.startDate);
    this.totalDays = Math.max(1, Math.ceil(diffMs / (1000 * 60 * 60 * 24)) + 1);
  }
  next();
});

module.exports = mongoose.model('Leave', leaveSchema);
