const Payment = require('../models/Payment');
const User = require('../models/User');
const { processSalaryPayout } = require('../services/stripeService');

// Initiate salary payout (Admin/HR only)
const initiateSalaryPayout = async (req, res, next) => {
  try {
    const { employeeId, amount } = req.body;

    if (!employeeId || !amount) {
      return res.status(400).json({ success: false, message: 'Employee ID and salary amount are required' });
    }

    const employee = await User.findById(employeeId);
    if (!employee || employee.status !== 'active') {
      return res.status(404).json({ success: false, message: 'Active employee not found' });
    }

    // Call Stripe service
    let payoutResult;
    try {
      payoutResult = await processSalaryPayout(amount, employee.email);
    } catch (stripeError) {
      // Record failed payment in history
      const failedPayment = new Payment({
        employee: employeeId,
        amount,
        currency: 'usd',
        stripePaymentIntentId: 'failed_' + Date.now(),
        status: 'failed'
      });
      await failedPayment.save();

      return res.status(400).json({ 
        success: false, 
        message: `Stripe processing failed: ${stripeError.message}`,
        payment: failedPayment
      });
    }

    // Record completed payment
    const payment = new Payment({
      employee: employeeId,
      amount: payoutResult.amount,
      currency: 'usd',
      stripePaymentIntentId: payoutResult.id,
      status: payoutResult.status,
      paidAt: Date.now()
    });

    await payment.save();

    res.status(201).json({
      success: true,
      message: `Salary payout of $${amount} successfully completed for ${employee.name}`,
      payment
    });
  } catch (error) {
    next(error);
  }
};

// Get payroll / payment history (Role-based)
const getPaymentHistory = async (req, res, next) => {
  try {
    let query = {};

    if (req.user.role === 'employee') {
      query = { employee: req.user._id };
    }
    // Admin and HR can see all payments

    const payments = await Payment.find(query)
      .populate('employee', 'name email role department designation status')
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: payments.length,
      payments
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  initiateSalaryPayout,
  getPaymentHistory
};
