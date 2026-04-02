import { getDB } from '../database/database.js';
import bcrypt from 'bcryptjs';

export const userModel = {
  findAll: () => {
    const db = getDB();
    return db.prepare(`
      SELECT u.id, u.username, u.email, u.status, u.created_at, u.updated_at, 
             r.name as role_name, r.description as role_description
      FROM users u
      JOIN roles r ON u.role_id = r.id
      ORDER BY u.created_at DESC
    `).all();
  },
  
  findById: (id) => {
    const db = getDB();
    return db.prepare(`
      SELECT u.id, u.username, u.email, u.status, u.created_at, u.updated_at, 
             r.id as role_id, r.name as role_name, r.description as role_description
      FROM users u
      JOIN roles r ON u.role_id = r.id
      WHERE u.id = ?
    `).get(id);
  },
  
  findByUsername: (username) => {
    const db = getDB();
    return db.prepare(`
      SELECT u.id, u.username, u.email, u.password_hash, u.status, u.created_at, u.updated_at, 
             r.id as role_id, r.name as role_name, r.description as role_description
      FROM users u
      JOIN roles r ON u.role_id = r.id
      WHERE u.username = ?
    `).get(username);
  },
  
  findByEmail: (email) => {
    const db = getDB();
    return db.prepare('SELECT * FROM users WHERE email = ?').get(email);
  },
  
  create: (userData) => {
    const db = getDB();
    const { username, email, password, role_id } = userData;
    const passwordHash = bcrypt.hashSync(password, 10);
    
    const result = db.prepare(`
      INSERT INTO users (username, email, password_hash, role_id, status)
      VALUES (?, ?, ?, ?, 'active')
    `).run(username, email, passwordHash, role_id);
    
    return userModel.findById(result.lastInsertRowid);
  },
  
  update: (id, userData) => {
    const db = getDB();
    const { username, email, role_id, status } = userData;
    
    const user = userModel.findById(id);
    if (!user) {
      return null;
    }
    
    db.prepare(`
      UPDATE users 
      SET username = COALESCE(?, username),
          email = COALESCE(?, email),
          role_id = COALESCE(?, role_id),
          status = COALESCE(?, status),
          updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `).run(username, email, role_id, status, id);
    
    return userModel.findById(id);
  },
  
  updateStatus: (id, status) => {
    const db = getDB();
    db.prepare(`
      UPDATE users 
      SET status = ?, updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `).run(status, id);
    
    return userModel.findById(id);
  },
  
  delete: (id) => {
    const db = getDB();
    const user = userModel.findById(id);
    
    if (!user) {
      return false;
    }
    
    db.prepare('DELETE FROM users WHERE id = ?').run(id);
    return true;
  },
  
  count: () => {
    const db = getDB();
    return db.prepare('SELECT COUNT(*) as count FROM users').get().count;
  }
};

export default userModel;
