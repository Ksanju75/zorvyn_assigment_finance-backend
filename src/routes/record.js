import express from 'express';
import { recordModel } from '../models/recordModel.js';
import { userModel } from '../models/userModel.js';
import authenticateToken from '../middleware/authMiddleware.js';
import { authorize } from '../middleware/authorizationMiddleware.js';
import { validateRequest, createRecordSchema, updateRecordSchema } from '../middleware/validationMiddleware.js';
import { createError } from '../middleware/errorHandler.js';

const router = express.Router();

// All routes require authentication
router.use(authenticateToken);

// GET /api/records - List all records (Admin and Analyst only)
router.get('/', authorize('admin', 'analyst'), (req, res, next) => {
  try {
    const filters = {};
    
    // Parse query parameters
    if (req.query.user_id) filters.user_id = parseInt(req.query.user_id);
    if (req.query.type) filters.type = req.query.type;
    if (req.query.category) filters.category = req.query.category;
    if (req.query.start_date) filters.start_date = req.query.start_date;
    if (req.query.end_date) filters.end_date = req.query.end_date;
    if (req.query.min_amount) filters.min_amount = parseFloat(req.query.min_amount);
    if (req.query.max_amount) filters.max_amount = parseFloat(req.query.max_amount);
    if (req.query.limit) filters.limit = parseInt(req.query.limit);
    if (req.query.offset) filters.offset = parseInt(req.query.offset);
    
    const records = recordModel.findAll(filters);
    const total = recordModel.count(filters);
    
    res.json({
      success: true,
      count: records.length,
      total: total,
      data: records
    });
  } catch (error) {
    next(error);
  }
});

// GET /api/records/my-records - Get current user's records (All roles)
router.get('/my-records', (req, res, next) => {
  try {
    const userId = req.userDetails.id;
    const filters = { user_id: userId };
    
    // Parse additional query parameters
    if (req.query.type) filters.type = req.query.type;
    if (req.query.category) filters.category = req.query.category;
    if (req.query.start_date) filters.start_date = req.query.start_date;
    if (req.query.end_date) filters.end_date = req.query.end_date;
    if (req.query.limit) filters.limit = parseInt(req.query.limit);
    
    const records = recordModel.findAll(filters);
    
    res.json({
      success: true,
      count: records.length,
      data: records
    });
  } catch (error) {
    next(error);
  }
});

// GET /api/records/:id - Get record by ID (Admin and Analyst only)
router.get('/:id', authorize('admin', 'analyst'), (req, res, next) => {
  try {
    const recordId = parseInt(req.params.id);
    const record = recordModel.findById(recordId);
    
    if (!record) {
      return next(createError('Record not found', 'not_found', 404));
    }
    
    res.json({
      success: true,
      data: record
    });
  } catch (error) {
    next(error);
  }
});

// POST /api/records - Create new record (Admin only)
router.post('/', authorize('admin'), validateRequest(createRecordSchema), (req, res, next) => {
  try {
    const { user_id, amount, type, category, date } = req.validatedBody;
    // Get description safely - Joi strips optional fields
    const description = req.validatedBody.description === undefined ? null : req.validatedBody.description;
    
    console.log('Creating record:', { user_id, amount, type, category, date, description });
    
    // Verify user exists
    const user = userModel.findById(user_id);
    if (!user) {
      return next(createError('User not found', 'validation_error', 400));
    }
    
    // Create record
    const newRecord = recordModel.create({ 
      user_id, 
      amount, 
      type, 
      category, 
      date, 
      description 
    });
    
    res.status(201).json({
      success: true,
      message: 'Record created successfully',
      data: newRecord
    });
  } catch (error) {
    next(error);
  }
});

// PUT /api/records/:id - Update record (Admin only)
router.put('/:id', authorize('admin'), validateRequest(updateRecordSchema), (req, res, next) => {
  try {
    const recordId = parseInt(req.params.id);
    const updates = req.validatedBody;
    
    const record = recordModel.findById(recordId);
    if (!record) {
      return next(createError('Record not found', 'not_found', 404));
    }
    
    // Update record
    const updatedRecord = recordModel.update(recordId, updates);
    
    res.json({
      success: true,
      message: 'Record updated successfully',
      data: updatedRecord
    });
  } catch (error) {
    next(error);
  }
});

// DELETE /api/records/:id - Delete record (Admin only)
router.delete('/:id', authorize('admin'), (req, res, next) => {
  try {
    const recordId = parseInt(req.params.id);
    const record = recordModel.findById(recordId);
    
    if (!record) {
      return next(createError('Record not found', 'not_found', 404));
    }
    
    // Delete record
    recordModel.delete(recordId);
    
    res.json({
      success: true,
      message: 'Record deleted successfully'
    });
  } catch (error) {
    next(error);
  }
});

export default router;
