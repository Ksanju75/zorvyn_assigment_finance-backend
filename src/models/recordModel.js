import { getDB } from '../database/database.js';

export const recordModel = {
  findAll: (filters = {}) => {
    const db = getDB();
    let query = `
      SELECT r.*, u.username as user_name, u.email as user_email
      FROM financial_records r
      JOIN users u ON r.user_id = u.id
      WHERE 1=1
    `;
    
    const params = [];
    
    if (filters.user_id) {
      query += ' AND r.user_id = ?';
      params.push(filters.user_id);
    }
    
    if (filters.type) {
      query += ' AND r.type = ?';
      params.push(filters.type);
    }
    
    if (filters.category) {
      query += ' AND r.category = ?';
      params.push(filters.category);
    }
    
    if (filters.start_date) {
      query += ' AND r.date >= ?';
      params.push(filters.start_date);
    }
    
    if (filters.end_date) {
      query += ' AND r.date <= ?';
      params.push(filters.end_date);
    }
    
    if (filters.min_amount) {
      query += ' AND r.amount >= ?';
      params.push(filters.min_amount);
    }
    
    if (filters.max_amount) {
      query += ' AND r.amount <= ?';
      params.push(filters.max_amount);
    }
    
    query += ' ORDER BY r.date DESC, r.created_at DESC';
    
    if (filters.limit) {
      query += ' LIMIT ?';
      params.push(parseInt(filters.limit));
    }
    
    if (filters.offset) {
      query += ' OFFSET ?';
      params.push(parseInt(filters.offset));
    }
    
    return db.prepare(query).all(...params);
  },
  
  findById: (id) => {
    const db = getDB();
    return db.prepare(`
      SELECT r.*, u.username as user_name, u.email as user_email
      FROM financial_records r
      JOIN users u ON r.user_id = u.id
      WHERE r.id = ?
    `).get(id);
  },
  
  findByUserId: (userId) => {
    const db = getDB();
    return db.prepare(`
      SELECT * FROM financial_records
      WHERE user_id = ?
      ORDER BY date DESC, created_at DESC
    `).all(userId);
  },
  
create: (recordData) => {
  const db = getDB();
  const { user_id, amount, type, category, date, description } = recordData;
  
  // Convert Date object to string if needed
  const dateStr = date instanceof Date ? date.toISOString().split('T')[0] : date;
  
  // Force description to null if undefined or not provided
  const descValue = description ?? null;
  
  console.log('Model received:', { user_id, amount, type, category, date: dateStr, descValue });
  
  const result = db.prepare(`
    INSERT INTO financial_records (user_id, amount, type, category, date, description)
    VALUES (?, ?, ?, ?, ?, ?)
  `).run(user_id, amount, type, category, dateStr, descValue);
  
  return recordModel.findById(result.lastInsertRowid);
},
  
  update: (id, recordData) => {
    const db = getDB();
    const { amount, type, category, date, description } = recordData;
    
    const record = recordModel.findById(id);
    if (!record) {
      return null;
    }
    
    db.prepare(`
      UPDATE financial_records 
      SET amount = COALESCE(?, amount),
          type = COALESCE(?, type),
          category = COALESCE(?, category),
          date = COALESCE(?, date),
          description = COALESCE(?, description),
          updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `).run(amount, type, category, date, description, id);
    
    return recordModel.findById(id);
  },
  
  delete: (id) => {
    const db = getDB();
    const record = recordModel.findById(id);
    
    if (!record) {
      return false;
    }
    
    db.prepare('DELETE FROM financial_records WHERE id = ?').run(id);
    return true;
  },
  
  count: (filters = {}) => {
    const db = getDB();
    let query = 'SELECT COUNT(*) as count FROM financial_records WHERE 1=1';
    const params = [];
    
    if (filters.user_id) {
      query += ' AND user_id = ?';
      params.push(filters.user_id);
    }
    
    if (filters.type) {
      query += ' AND type = ?';
      params.push(filters.type);
    }
    
    if (filters.category) {
      query += ' AND category = ?';
      params.push(filters.category);
    }
    
    if (filters.start_date) {
      query += ' AND date >= ?';
      params.push(filters.start_date);
    }
    
    if (filters.end_date) {
      query += ' AND date <= ?';
      params.push(filters.end_date);
    }
    
    return db.prepare(query).get(...params).count;
  },
  
  getTotals: (userId = null) => {
    const db = getDB();
    let query = `
      SELECT 
        SUM(CASE WHEN type = 'income' THEN amount ELSE 0 END) as total_income,
        SUM(CASE WHEN type = 'expense' THEN amount ELSE 0 END) as total_expense,
        SUM(CASE WHEN type = 'income' THEN amount ELSE -amount END) as net_balance
      FROM financial_records
    `;
    
    if (userId) {
      query += ' WHERE user_id = ?';
      return db.prepare(query).get(userId);
    }
    
    return db.prepare(query).get();
  },
  
  getCategoryTotals: (userId = null, type = null) => {
    const db = getDB();
    let query = `
      SELECT category, type, SUM(amount) as total
      FROM financial_records
    `;
    
    const conditions = [];
    const params = [];
    
    if (userId) {
      conditions.push('user_id = ?');
      params.push(userId);
    }
    
    if (type) {
      conditions.push('type = ?');
      params.push(type);
    }
    
    if (conditions.length > 0) {
      query += ' WHERE ' + conditions.join(' AND ');
    }
    
    query += ' GROUP BY category, type ORDER BY total DESC';
    
    return db.prepare(query).all(...params);
  },
  
  getMonthlyTrends: (months = 6, userId = null) => {
    const db = getDB();
    let query = `
      SELECT 
        strftime('%Y-%m', date) as month,
        SUM(CASE WHEN type = 'income' THEN amount ELSE 0 END) as income,
        SUM(CASE WHEN type = 'expense' THEN amount ELSE 0 END) as expense
      FROM financial_records
      WHERE date >= date('now', '-' || ? || ' months')
    `;
    
    const params = [months];
    
    if (userId) {
      query += ' AND user_id = ?';
      params.push(userId);
    }
    
    query += ' GROUP BY strftime(\'%Y-%m\', date) ORDER BY month DESC';
    
    return db.prepare(query).all(...params);
  },
  
  getRecentActivity: (limit = 10, userId = null) => {
    const db = getDB();
    let query = `
      SELECT r.*, u.username as user_name
      FROM financial_records r
      JOIN users u ON r.user_id = u.id
    `;
    
    if (userId) {
      query += ' WHERE r.user_id = ?';
      return db.prepare(query).all(userId).slice(0, limit);
    }
    
    query += ' ORDER BY r.created_at DESC';
    return db.prepare(query).all().slice(0, limit);
  }
};

export default recordModel;
