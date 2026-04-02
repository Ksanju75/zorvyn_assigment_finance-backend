import express from 'express';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import { userModel } from '../models/userModel.js';
import { validateRequest, loginSchema } from '../middleware/validationMiddleware.js';
import authenticateToken from '../middleware/authMiddleware.js';
import { createError } from '../middleware/errorHandler.js';

const router = express.Router();

// POST /api/auth/login - Login user
router.post('/login', validateRequest(loginSchema), async (req, res, next) => {
  try {
    const { username, password } = req.validatedBody;
    
    // Find user
    const user = userModel.findByUsername(username);
    
    if (!user) {
      return next(createError('Invalid credentials', 'unauthorized', 401));
    }
    
    // Check if user is active
    if (user.status !== 'active') {
      return next(createError('User account is not active', 'forbidden', 403));
    }
    
    // Verify password
    const validPassword = bcrypt.compareSync(password, user.password_hash);
    
    if (!validPassword) {
      return next(createError('Invalid credentials', 'unauthorized', 401));
    }
    
    // Generate JWT token
    const token = jwt.sign(
      { 
        id: user.id, 
        username: user.username,
        role: user.role_name 
      },
      process.env.JWT_SECRET,
      { expiresIn: '24h' }
    );
    
    res.json({
      success: true,
      message: 'Login successful',
      data: {
        token,
        user: {
          id: user.id,
          username: user.username,
          email: user.email,
          role: user.role_name,
          status: user.status
        }
      }
    });
  } catch (error) {
    next(error);
  }
});

// GET /api/auth/me - Get current user info
router.get('/me', authenticateToken, (req, res) => {
  res.json({
    success: true,
    data: {
      id: req.userDetails.id,
      username: req.userDetails.username,
      email: req.userDetails.email,
      role: req.userDetails.role_name,
      status: req.userDetails.status
    }
  });
});

export default router;
