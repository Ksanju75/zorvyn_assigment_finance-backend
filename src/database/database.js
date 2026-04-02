import Database from 'better-sqlite3';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

let db;

export const getDB = () => {
  if (!db) {
    throw new Error('Database not initialized. Call initDatabase() first.');
  }
  return db;
};

export const initDatabase = () => {
  const dbPath = path.join(__dirname, '../../finance.db');
  db = new Database(dbPath);
  
  // Enable foreign keys
  db.pragma('foreign_keys = ON');
  
  // Create tables
  createTables(db);
  
  console.log('Database initialized successfully');
  return db;
};

const createTables = (db) => {
  // Roles table
  db.exec(`
    CREATE TABLE IF NOT EXISTS roles (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT UNIQUE NOT NULL,
      description TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);
  
  // Users table
  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      username TEXT UNIQUE NOT NULL,
      email TEXT UNIQUE NOT NULL,
      password_hash TEXT NOT NULL,
      role_id INTEGER NOT NULL,
      status TEXT DEFAULT 'active' CHECK(status IN ('active', 'inactive', 'suspended')),
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (role_id) REFERENCES roles(id)
    )
  `);
  
  // Financial records table
  db.exec(`
    CREATE TABLE IF NOT EXISTS financial_records (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      amount REAL NOT NULL,
      type TEXT NOT NULL CHECK(type IN ('income', 'expense')),
      category TEXT NOT NULL,
      date DATE NOT NULL,
      description TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id)
    )
  `);
  
  // Create indexes for better query performance
  db.exec(`CREATE INDEX IF NOT EXISTS idx_records_user_id ON financial_records(user_id)`);
  db.exec(`CREATE INDEX IF NOT EXISTS idx_records_type ON financial_records(type)`);
  db.exec(`CREATE INDEX IF NOT EXISTS idx_records_category ON financial_records(category)`);
  db.exec(`CREATE INDEX IF NOT EXISTS idx_records_date ON financial_records(date)`);
  db.exec(`CREATE INDEX IF NOT EXISTS idx_users_role ON users(role_id)`);
  db.exec(`CREATE INDEX IF NOT EXISTS idx_users_status ON users(status)`);
  
  console.log('Tables created successfully');
};

export default db;
