import express from 'express';
import { recordModel } from '../models/recordModel.js';
import authenticateToken from '../middleware/authMiddleware.js';
import { authorize } from '../middleware/authorizationMiddleware.js';

const router = express.Router();

// All routes require authentication
router.use(authenticateToken);

// GET /api/dashboard/summary - Get overall summary (Admin and Analyst only)
router.get('/summary', authorize('admin', 'analyst'), (req, res, next) => {
  try {
    const totals = recordModel.getTotals();
    
    res.json({
      success: true,
      data: {
        total_income: +(totals.total_income || 0).toFixed(2),
        total_expense: +(totals.total_expense || 0).toFixed(2),
        net_balance: +(totals.net_balance || 0).toFixed(2)
      }
    });
  } catch (error) {
    next(error);
  }
});

// GET /api/dashboard/my-summary - Get current user's summary (All roles)
router.get('/my-summary', (req, res, next) => {
  try {
    const userId = req.userDetails.id;
    const totals = recordModel.getTotals(userId);
    
    res.json({
      success: true,
      data: {
        total_income: +(totals.total_income || 0).toFixed(2),
        total_expense: +(totals.total_expense || 0).toFixed(2),
        net_balance: +(totals.net_balance || 0).toFixed(2)
      }
    });
  } catch (error) {
    next(error);
  }
});

// GET /api/dashboard/category-totals - Get category-wise totals (Admin and Analyst only)
router.get('/category-totals', authorize('admin', 'analyst'), (req, res, next) => {
  try {
    const type = req.query.type || null;
    const categories = recordModel.getCategoryTotals(null, type);
    
    // Format the response
    const categoryData = {};
    categories.forEach(cat => {
      if (!categoryData[cat.category]) {
        categoryData[cat.category] = {
          category: cat.category,
          income: 0,
          expense: 0
        };
      }
      
      if (cat.type === 'income') {
        categoryData[cat.category].income = +cat.total.toFixed(2);
      } else {
        categoryData[cat.category].expense = +cat.total.toFixed(2);
      }
    });
    
    res.json({
      success: true,
      count: Object.keys(categoryData).length,
      data: Object.values(categoryData)
    });
  } catch (error) {
    next(error);
  }
});

// GET /api/dashboard/my-category-totals - Get current user's category totals (All roles)
router.get('/my-category-totals', (req, res, next) => {
  try {
    const userId = req.userDetails.id;
    const type = req.query.type || null;
    const categories = recordModel.getCategoryTotals(userId, type);
    
    // Format the response
    const categoryData = {};
    categories.forEach(cat => {
      if (!categoryData[cat.category]) {
        categoryData[cat.category] = {
          category: cat.category,
          income: 0,
          expense: 0
        };
      }
      
      if (cat.type === 'income') {
        categoryData[cat.category].income = +cat.total.toFixed(2);
      } else {
        categoryData[cat.category].expense = +cat.total.toFixed(2);
      }
    });
    
    res.json({
      success: true,
      count: Object.keys(categoryData).length,
      data: Object.values(categoryData)
    });
  } catch (error) {
    next(error);
  }
});

// GET /api/dashboard/monthly-trends - Get monthly trends (Admin and Analyst only)
router.get('/monthly-trends', authorize('admin', 'analyst'), (req, res, next) => {
  try {
    const months = parseInt(req.query.months) || 6;
    const trends = recordModel.getMonthlyTrends(months);
    
    res.json({
      success: true,
      count: trends.length,
      data: trends.map(trend => ({
        month: trend.month,
        income: +(trend.income || 0).toFixed(2),
        expense: +(trend.expense || 0).toFixed(2)
      }))
    });
  } catch (error) {
    next(error);
  }
});

// GET /api/dashboard/my-monthly-trends - Get current user's monthly trends (All roles)
router.get('/my-monthly-trends', (req, res, next) => {
  try {
    const userId = req.userDetails.id;
    const months = parseInt(req.query.months) || 6;
    const trends = recordModel.getMonthlyTrends(months, userId);
    
    res.json({
      success: true,
      count: trends.length,
      data: trends.map(trend => ({
        month: trend.month,
        income: +(trend.income || 0).toFixed(2),
        expense: +(trend.expense || 0).toFixed(2)
      }))
    });
  } catch (error) {
    next(error);
  }
});

// GET /api/dashboard/recent-activity - Get recent activity (Admin and Analyst only)
router.get('/recent-activity', authorize('admin', 'analyst'), (req, res, next) => {
  try {
    const limit = parseInt(req.query.limit) || 10;
    const activities = recordModel.getRecentActivity(limit);
    
    res.json({
      success: true,
      count: activities.length,
      data: activities
    });
  } catch (error) {
    next(error);
  }
});

// GET /api/dashboard/my-recent-activity - Get current user's recent activity (All roles)
router.get('/my-recent-activity', (req, res, next) => {
  try {
    const userId = req.userDetails.id;
    const limit = parseInt(req.query.limit) || 10;
    const activities = recordModel.getRecentActivity(limit, userId);
    
    res.json({
      success: true,
      count: activities.length,
      data: activities
    });
  } catch (error) {
    next(error);
  }
});

export default router;
