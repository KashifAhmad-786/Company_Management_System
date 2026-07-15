const User = require('../models/User');
const Department = require('../models/Department');

// Create a new employee profile (Admin/HR only)
const createEmployee = async (req, res, next) => {
  try {
    const { name, email, password, role, department, designation, salary, joiningDate } = req.body;

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ success: false, message: 'Employee with this email already exists' });
    }

    // Verify department exists
    const dept = await Department.findById(department);
    if (!dept) {
      return res.status(400).json({ success: false, message: 'Invalid department ID' });
    }

    const employee = new User({
      name,
      email,
      password: password || 'Welcome@123', // Default password if not provided
      role,
      department,
      designation,
      salary,
      joiningDate: joiningDate || Date.now(),
      isVerified: true, // Manually onboarded employees are pre-verified
      provider: 'local',
      status: 'active'
    });

    await employee.save();

    res.status(201).json({
      success: true,
      message: 'Employee onboarding successful',
      employee: {
        id: employee._id,
        name: employee.name,
        email: employee.email,
        role: employee.role,
        department: dept.name,
        designation: employee.designation
      }
    });
  } catch (error) {
    next(error);
  }
};

// Get all employees (Admin/HR can see all; Managers can see team/employees; Employees can see themselves)
const getEmployees = async (req, res, next) => {
  try {
    let query = { status: 'active' }; // Only show active employees — inactive (deleted) are hidden

    // Employees can only see their own profile
    if (req.user.role === 'employee') {
      query = { _id: req.user._id, status: 'active' };
    }

    const employees = await User.find(query)
      .populate('department', 'name')
      .select('-password -refreshToken')
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: employees.length,
      employees
    });
  } catch (error) {
    next(error);
  }
};

// Get single employee by ID
const getEmployeeById = async (req, res, next) => {
  try {
    const employeeId = req.params.id;

    // Check permissions
    if (req.user.role === 'employee' && req.user._id.toString() !== employeeId) {
      return res.status(403).json({ success: false, message: 'Not authorized to view other employee details' });
    }

    const employee = await User.findById(employeeId)
      .populate('department', 'name description')
      .select('-password -refreshToken');

    if (!employee) {
      return res.status(404).json({ success: false, message: 'Employee not found' });
    }

    res.status(200).json({
      success: true,
      employee
    });
  } catch (error) {
    next(error);
  }
};

// Update employee details (Admin/HR only)
const updateEmployee = async (req, res, next) => {
  try {
    const employeeId = req.params.id;
    const updates = req.body;

    // Do not allow changing email or password directly through this profile editor
    delete updates.email;
    delete updates.password;
    delete updates.provider;
    delete updates.googleId;
    delete updates.refreshToken;

    if (updates.department) {
      const dept = await Department.findById(updates.department);
      if (!dept) {
        return res.status(400).json({ success: false, message: 'Invalid department ID' });
      }
    }

    const employee = await User.findByIdAndUpdate(
      employeeId,
      { $set: updates },
      { new: true, runValidators: true }
    ).populate('department', 'name').select('-password -refreshToken');

    if (!employee) {
      return res.status(404).json({ success: false, message: 'Employee not found' });
    }

    res.status(200).json({
      success: true,
      message: 'Employee profile updated successfully',
      employee
    });
  } catch (error) {
    next(error);
  }
};

// Deactivate/Delete employee (Admin/HR only)
const deleteEmployee = async (req, res, next) => {
  try {
    const employeeId = req.params.id;

    // Instead of hard delete, toggle status to inactive to preserve audit logs
    const employee = await User.findById(employeeId);
    if (!employee) {
      return res.status(404).json({ success: false, message: 'Employee not found' });
    }

    employee.status = 'inactive';
    await employee.save();

    res.status(200).json({
      success: true,
      message: `Employee ${employee.name} deactivated successfully`
    });
  } catch (error) {
    next(error);
  }
};

// Department management
const createDepartment = async (req, res, next) => {
  try {
    const { name, description } = req.body;

    const existingDept = await Department.findOne({ name });
    if (existingDept) {
      return res.status(400).json({ success: false, message: 'Department already exists' });
    }

    const department = new Department({ name, description });
    await department.save();

    res.status(201).json({
      success: true,
      message: 'Department created successfully',
      department
    });
  } catch (error) {
    next(error);
  }
};

const getDepartments = async (req, res, next) => {
  try {
    const departments = await Department.find({}).sort({ name: 1 });
    res.status(200).json({
      success: true,
      count: departments.length,
      departments
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  createEmployee,
  getEmployees,
  getEmployeeById,
  updateEmployee,
  deleteEmployee,
  createDepartment,
  getDepartments
};
