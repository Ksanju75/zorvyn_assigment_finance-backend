import { getDB } from '../database/database.js';

export const roleModel = {
  findAll: () => {
    const db = getDB();
    return db.prepare('SELECT * FROM roles ORDER BY name').all();
  },
  
  findById: (id) => {
    const db = getDB();
    return db.prepare('SELECT * FROM roles WHERE id = ?').get(id);
  },
  
  findByName: (name) => {
    const db = getDB();
    return db.prepare('SELECT * FROM roles WHERE name = ?').get(name);
  },
  
  create: (name, description) => {
    const db = getDB();
    const result = db.prepare(`
      INSERT INTO roles (name, description)
      VALUES (?, ?)
    `).run(name, description);
    
    return roleModel.findById(result.lastInsertRowid);
  },
  
  update: (id, name, description) => {
    const db = getDB();
    db.prepare(`
      UPDATE roles 
      SET name = COALESCE(?, name),
          description = COALESCE(?, description)
      WHERE id = ?
    `).run(name, description, id);
    
    return roleModel.findById(id);
  },
  
  delete: (id) => {
    const db = getDB();
    const role = roleModel.findById(id);
    
    if (!role) {
      return false;
    }
    
    // Check if role is being used by any users
    const userCount = db.prepare('SELECT COUNT(*) as count FROM users WHERE role_id = ?').get(id).count;
    if (userCount > 0) {
      throw new Error(`Cannot delete role. ${userCount} user(s) are using this role.`);
    }
    
    db.prepare('DELETE FROM roles WHERE id = ?').run(id);
    return true;
  }
};

export default roleModel;
