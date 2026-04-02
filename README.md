# Finance Backend - Data Processing and Access Control System

A backend API for managing financial data with role-based access control, built with Node.js, Express, and SQLite.

## Overview

This finance backend provides user management, financial record tracking, and dashboard analytics with three-tier role-based access control (Viewer, Analyst, Admin).

## Quick Start

```bash
# Install dependencies
npm install

# Initialize database with sample data
npm run seed

# Start server
npm start
```

Server runs on `http://localhost:3000`

## Default Login Credentials

| Username | Password | Role | Access Level |
|----------|----------|------|--------------|
| admin | admin123 | Admin | Full access |
| viewer1 | password123 | Viewer | View only |
| analyst1 | password123 | Analyst | View + analytics |

## Tech Stack

- **Runtime:** Node.js
- **Framework:** Express.js
- **Database:** SQLite
- **Authentication:** JWT
- **Validation:** Joi

## API Endpoints

### Authentication
- `POST /api/auth/login` - Login
- `GET /api/auth/me` - Get current user

### User Management (Admin only)
- `GET /api/users` - List users
- `POST /api/users` - Create user
- `PUT /api/users/:id` - Update user
- `DELETE /api/users/:id` - Delete user

### Financial Records
- `GET /api/records` - List all records (Admin/Analyst)
- `GET /api/records/my-records` - Get your records
- `POST /api/records` - Create record (Admin)
- `PUT /api/records/:id` - Update record (Admin)
- `DELETE /api/records/:id` - Delete record (Admin)

Filters: `?type=income|expense`, `?category=Food`, `?start_date=2024-01-01`, `?limit=10`

### Dashboard Analytics
- `GET /api/dashboard/summary` - Total income/expenses/balance
- `GET /api/dashboard/category-totals` - Breakdown by category
- `GET /api/dashboard/monthly-trends` - Monthly trends (last 6 months)
- `GET /api/dashboard/recent-activity` - Recent transactions

## Usage Examples

### Login
```bash
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"admin123"}'
```

### Get Dashboard Summary
```bash
curl http://localhost:3000/api/dashboard/summary \
  -H "Authorization: Bearer YOUR_TOKEN"
```

### Create Financial Record
```bash
curl -X POST http://localhost:3000/api/records \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{
    "user_id": 1,
    "amount": 5000,
    "type": "income",
    "category": "Salary",
    "date": "2024-04-02"
  }'
```

## Role Permissions

| Action | Viewer | Analyst | Admin |
|--------|--------|---------|-------|
| View Dashboard | Yes | Yes | Yes |
| View Records | No | Yes | Yes |
| Create/Edit Records | No | No | Yes |
| Manage Users | No | No | Yes |

## Testing

```bash
# Run automated tests
npm test

# Quick API test script
./test-api.sh
```

## Project Structure

```
src/
├── index.js              # Entry point
├── database/             # Database setup & seeding
├── models/               # Data models (user, record, role)
├── routes/               # API routes
├── middleware/           # Auth, validation, error handling
└── test/                 # Test suite
```

## Configuration

Create `.env` file:
```env
PORT=3000
JWT_SECRET=your-secret-key
NODE_ENV=development
```

## Notes

- Database file (`finance.db`) is auto-created
- Sample data includes 130+ records spanning 6 months
- All timestamps in UTC
- JWT tokens expire after 24 hours

---

**Author:** Sanju Kirade  
**Email:** sanjukirade75@gmail.com  

MIT License - Created for educational purposes.
