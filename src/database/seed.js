import { getDB, initDatabase } from './database.js';
import bcrypt from 'bcryptjs';

export const createDefaultRoles = () => {
  const db = getDB();
  
  const defaultRoles = [
    { name: 'viewer', description: 'Can only view dashboard data' },
    { name: 'analyst', description: 'Can view records and access insights' },
    { name: 'admin', description: 'Can create, update, and manage records and users' }
  ];
  
  const stmt = db.prepare(`
    INSERT OR IGNORE INTO roles (name, description) 
    VALUES (?, ?)
  `);
  
  defaultRoles.forEach(role => {
    stmt.run(role.name, role.description);
  });
  
  console.log('Default roles created');
};

export const createDefaultAdmin = () => {
  const db = getDB();
  
  // Check if admin already exists
  const existingAdmin = db.prepare('SELECT * FROM users WHERE username = ?').get('admin');
  
  if (existingAdmin) {
    console.log('Default admin already exists');
    return;
  }
  
  // Get admin role ID
  const adminRole = db.prepare('SELECT id FROM roles WHERE name = ?').get('admin');
  
  if (!adminRole) {
    console.error('Admin role not found. Creating roles first.');
    createDefaultRoles();
    return;
  }
  
  // Hash password
  const passwordHash = bcrypt.hashSync('admin123', 10);
  
  // Create admin user
  db.prepare(`
    INSERT INTO users (username, email, password_hash, role_id, status)
    VALUES (?, ?, ?, ?, 'active')
  `).run('admin', 'admin@finance.com', passwordHash, adminRole.id);
  
  console.log('Default admin user created (username: admin, password: admin123)');
};

export const seedSampleData = () => {
  const db = getDB();
  
  // Check if data already exists
  const recordCount = db.prepare('SELECT COUNT(*) as count FROM financial_records').get();
  
  if (recordCount.count > 0) {
    console.log('Sample data already exists');
    return;
  }
  
  // Get viewer and analyst roles
  const viewerRole = db.prepare('SELECT id FROM roles WHERE name = ?').get('viewer');
  const analystRole = db.prepare('SELECT id FROM roles WHERE name = ?').get('analyst');
  
  // Create sample users
  const users = [
    { username: 'viewer1', email: 'viewer@test.com', role_id: viewerRole.id },
    { username: 'analyst1', email: 'analyst@test.com', role_id: analystRole.id },
    { username: 'john', email: 'john@test.com', role_id: analystRole.id },
    { username: 'sarah', email: 'sarah@test.com', role_id: viewerRole.id }
  ];
  
  const userStmt = db.prepare(`
    INSERT INTO users (username, email, password_hash, role_id, status)
    VALUES (?, ?, ?, ?, 'active')
  `);
  
  const passwordHash = bcrypt.hashSync('password123', 10);
  
  users.forEach(user => {
    userStmt.run(user.username, user.email, passwordHash, user.role_id);
  });
  
  console.log('Sample users created');
  
  // Get user IDs for sample records
  const adminUser = db.prepare('SELECT id FROM users WHERE username = ?').get('admin');
  const analystUser = db.prepare('SELECT id FROM users WHERE username = ?').get('analyst1');
  const johnUser = db.prepare('SELECT id FROM users WHERE username = ?').get('john');
  
  // Sample financial records
  const categories = ['Salary', 'Freelance', 'Investment', 'Food', 'Transport', 'Utilities', 'Entertainment', 'Shopping', 'Healthcare', 'Education'];
  const records = [];
  
  // Generate records for last 6 months
  const today = new Date();
  for (let i = 0; i < 180; i++) {
    const date = new Date(today);
    date.setDate(date.getDate() - i);
    
    // Income records (less frequent)
    if (i % 30 === 0 && adminUser) {
      records.push({
        user_id: adminUser.id,
        amount: +(Math.random() * 3000 + 2000).toFixed(2),
        type: 'income',
        category: categories[Math.floor(Math.random() * 3)],
        date: date.toISOString().split('T')[0],
        description: 'Monthly income'
      });
    }
    
    // Expense records (more frequent)
    if (Math.random() > 0.3) {
      const userId = [adminUser?.id, analystUser?.id, johnUser?.id].filter(Boolean)[Math.floor(Math.random() * 3)];
      records.push({
        user_id: userId,
        amount: +(Math.random() * 500 + 20).toFixed(2),
        type: 'expense',
        category: categories[3 + Math.floor(Math.random() * 7)],
        date: date.toISOString().split('T')[0],
        description: `Expense on ${date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}`
      });
    }
  }
  
  const recordStmt = db.prepare(`
    INSERT INTO financial_records (user_id, amount, type, category, date, description)
    VALUES (?, ?, ?, ?, ?, ?)
  `);
  
  db.transaction(() => {
    records.forEach(record => {
      recordStmt.run(record.user_id, record.amount, record.type, record.category, record.date, record.description);
    });
  })();
  
  console.log(`Sample financial records created: ${records.length} entries`);
};

// Initialize database and run seeds
initDatabase();
createDefaultRoles();
createDefaultAdmin();
seedSampleData();

console.log('\n✅ Database seeding completed successfully!');
console.log('\n📝 Default credentials:');
console.log('   Admin: username=admin, password=admin123');
console.log('   Other users: password=password123\n');

export default { createDefaultRoles, createDefaultAdmin, seedSampleData };
