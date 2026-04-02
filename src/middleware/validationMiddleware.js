import Joi from 'joi';
import { createError } from './errorHandler.js';

export const validateRequest = (schema) => {
  return (req, res, next) => {
    const { error, value } = schema.validate(req.body, { abortEarly: false });
    
    if (error) {
      const details = error.details.map(detail => ({
        field: detail.path.join('.'),
        message: detail.message
      }));
      
      const err = createError('Validation failed', 'validation_error', 400, details);
      return next(err);
    }
    
    req.validatedBody = value;
    next();
  };
};

// Validation schemas
export const loginSchema = Joi.object({
  username: Joi.string().min(3).max(50).required(),
  password: Joi.string().min(6).required()
});

export const registerUserSchema = Joi.object({
  username: Joi.string().min(3).max(50).required(),
  email: Joi.string().email().required(),
  password: Joi.string().min(6).required(),
  role_id: Joi.number().integer().positive().required()
});

export const updateUserSchema = Joi.object({
  username: Joi.string().min(3).max(50).optional(),
  email: Joi.string().email().optional(),
  role_id: Joi.number().integer().positive().optional(),
  status: Joi.string().valid('active', 'inactive', 'suspended').optional()
});

export const updateStatusSchema = Joi.object({
  status: Joi.string().valid('active', 'inactive', 'suspended').required()
});

export const createRecordSchema = Joi.object({
  user_id: Joi.number().integer().positive().required(),
  amount: Joi.number().positive().required(),
  type: Joi.string().valid('income', 'expense').required(),
  category: Joi.string().min(1).max(100).required(),
  date: Joi.date().iso().required(),
  description: Joi.string().max(500).allow('').optional()
});

export const updateRecordSchema = Joi.object({
  amount: Joi.number().positive().optional(),
  type: Joi.string().valid('income', 'expense').optional(),
  category: Joi.string().min(1).max(100).optional(),
  date: Joi.date().iso().optional(),
  description: Joi.string().max(500).allow('').optional()
});

export const createRoleSchema = Joi.object({
  name: Joi.string().min(2).max(50).required(),
  description: Joi.string().max(200).allow('').optional()
});

export default {
  validateRequest,
  loginSchema,
  registerUserSchema,
  updateUserSchema,
  updateStatusSchema,
  createRecordSchema,
  updateRecordSchema,
  createRoleSchema
};
