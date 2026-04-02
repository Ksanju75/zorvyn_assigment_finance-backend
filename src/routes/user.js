import express from 'express';
import { userModel } from '../models/userModel.js';
import { roleModel } from '../models/roleModel.js';
import authenticateToken from '../middleware/authMiddleware.js';
import { authorize } from '../middleware/authorizationMiddleware.js';
import { validateRequest, registerUserSchema, updateUserSchema, updateStatusSchema } from '../middleware/validationMiddleware.js';
import { createError } from '../middleware/errorHandler.js';

const router = express.Router();

// All routes require authentication
router.use(authenticateToken);

// GET /api/users - List all users (Admin only)
router.get('/', authorize('admin'), (req, res) => {
  try {
    const users = userModel.findAll();
    
    res.json({
      success: true,
      count: users.length,
      data: users
    });
  } catch (error) {
    next(error);
  }
});

// GET /api/users/roles - Get all available roles (Admin only)
router.get('/roles', authorize('admin'), (req, res) => {
  try {
    const roles = roleModel.findAll();
    
    res.json({
      success: true,
      count: roles.length,
      data: roles
    });
  } catch (error) {
    next(error);
  }
});

// GET /api/users/:id - Get user by ID (Admin only)
router.get('/:id', authorize('admin'), (req, res, next) => {
  try {
    const userId = parseInt(req.params.id);
    const user = userModel.findById(userId);
    
    if (!user) {
      return next(createError('User not found', 'not_found', 404));
    }
    
    res.json({
      success: true,
      data: user
    });
  } catch (error) {
    next(error);
  }
});

// POST /api/users - Create new user (Admin only)
router.post('/', authorize('admin'), validateRequest(registerUserSchema), (req, res, next) => {
  try {
    const { username, email, password, role_id } = req.validatedBody;
    
    // Check if username already exists
    const existingUser = userModel.findByUsername(username);
    if (existingUser) {
      return next(createError('Username already exists', 'validation_error', 400));
    }
    
    // Check if email already exists
    const existingEmail = userModel.findByEmail(email);
    if (existingEmail) {
      return next(createError('Email already exists', 'validation_error', 400));
    }
    
    // Verify role exists
    const role = roleModel.findById(role_id);
    if (!role) {
      return next(createError('Role not found', 'validation_error', 400));
    }
    
    // Create user
    const newUser = userModel.create({ username, email, password, role_id });
    
    res.status(201).json({
      success: true,
      message: 'User created successfully',
      data: newUser
    });
  } catch (error) {
    next(error);
  }
});

// PUT /api/users/:id - Update user (Admin only)
router.put('/:id', authorize('admin'), validateRequest(updateUserSchema), (req, res, next) => {
  try {
    const userId = parseInt(req.params.id);
    const updates = req.validatedBody;
    
    const user = userModel.findById(userId);
    if (!user) {
      return next(createError('User not found', 'not_found', 404));
    }
    
    // Prevent updating the last admin
    if (user.role_name === 'admin' && updates.role_id) {
      const adminCount = userModel.findAll().filter(u => u.role_name === 'admin').length;
      if (adminCount === 1 && userId === user.id) {
        return next(createError('Cannot remove the last admin user', 'forbidden', 403));
      }
    }
    
    // Update user
    const updatedUser = userModel.update(userId, updates);
    
    res.json({
      success: true,
      message: 'User updated successfully',
      data: updatedUser
    });
  } catch (error) {
    next(error);
  }
});

// PATCH /api/users/:id/status - Update user status (Admin only)
router.patch('/:id/status', authorize('admin'), validateRequest(updateStatusSchema), (req, res, next) => {
  try {
    const userId = parseInt(req.params.id);
    const { status } = req.validatedBody;
    
    const user = userModel.findById(userId);
    if (!user) {
      return next(createError('User not found', 'not_found', 404));
    }
    
    // Prevent deactivating the last admin
    if (user.role_name === 'admin' && status !== 'active') {
      const adminCount = userModel.findAll().filter(u => u.role_name === 'admin' && u.status === 'active').length;
      if (adminCount === 1 && userId === user.id) {
        return next(createError('Cannot deactivate the last active admin user', 'forbidden', 403));
      }
    }
    
    // Update status
    const updatedUser = userModel.updateStatus(userId, status);
    
    res.json({
      success: true,
      message: `User ${status} successfully`,
      data: updatedUser
    });
  } catch (error) {
    next(error);
  }
});

// DELETE /api/users/:id - Delete user (Admin only)
router.delete('/:id', authorize('admin'), (req, res, next) => {
  try {
    const userId = parseInt(req.params.id);
    const user = userModel.findById(userId);
    
    if (!user) {
      return next(createError('User not found', 'not_found', 404));
    }
    
    // Prevent deleting the last admin
    if (user.role_name === 'admin') {
      const adminCount = userModel.findAll().filter(u => u.role_name === 'admin').length;
      if (adminCount === 1 && userId === user.id) {
        return next(createError('Cannot delete the last admin user', 'forbidden', 403));
      }
    }
    
    // Delete user
    userModel.delete(userId);
    
    res.json({
      success: true,
      message: 'User deleted successfully'
    });
  } catch (error) {
    next(error);
  }
});

export default router;
