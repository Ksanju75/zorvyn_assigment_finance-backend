#!/bin/bash

# Finance Backend - Quick API Testing Script
# This script demonstrates all major API endpoints

BASE_URL="http://localhost:3000/api"
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo "=============================================="
echo "🧪 Finance Backend - Quick API Tests"
echo "=============================================="
echo ""

# Helper function to print section headers
print_header() {
    echo -e "${YELLOW}=== $1 ===${NC}"
}

# 1. Health Check
print_header "Health Check"
curl -s "$BASE_URL/health" | jq .
echo ""

# 2. Login as Admin
print_header "Login as Admin"
ADMIN_RESPONSE=$(curl -s -X POST "$BASE_URL/auth/login" \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"admin123"}')
echo "$ADMIN_RESPONSE" | jq .

ADMIN_TOKEN=$(echo "$ADMIN_RESPONSE" | jq -r '.data.token')
echo ""

# 3. Get Current User
print_header "Get Current User (Admin)"
curl -s "$BASE_URL/auth/me" \
  -H "Authorization: Bearer $ADMIN_TOKEN" | jq .
echo ""

# 4. Get Dashboard Summary
print_header "Dashboard Summary"
curl -s "$BASE_URL/dashboard/summary" \
  -H "Authorization: Bearer $ADMIN_TOKEN" | jq .
echo ""

# 5. Get Category Totals
print_header "Category Totals (Top 5)"
curl -s "$BASE_URL/dashboard/category-totals" \
  -H "Authorization: Bearer $ADMIN_TOKEN" | jq '.data[:5]'
echo ""

# 6. Get Monthly Trends
print_header "Monthly Trends (Last 3 Months)"
curl -s "$BASE_URL/dashboard/monthly-trends?months=3" \
  -H "Authorization: Bearer $ADMIN_TOKEN" | jq .
echo ""

# 7. Get Recent Activity
print_header "Recent Activity (Last 5)"
curl -s "$BASE_URL/dashboard/recent-activity?limit=5" \
  -H "Authorization: Bearer $ADMIN_TOKEN" | jq '.data[:5]'
echo ""

# 8. List Users
print_header "List All Users"
curl -s "$BASE_URL/users" \
  -H "Authorization: Bearer $ADMIN_TOKEN" | jq '{count: .count, users: [.data[] | {username, email, role_name, status}]}'
echo ""

# 9. Get Financial Records
print_header "Financial Records (First 5)"
curl -s "$BASE_URL/records?limit=5" \
  -H "Authorization: Bearer $ADMIN_TOKEN" | jq '{total: .total, showing: .count, records: [.data[] | {amount, type, category, date}]}'
echo ""

# 10. Filter Records by Type
print_header "Filter Expenses (First 3)"
curl -s "$BASE_URL/records?type=expense&limit=3" \
  -H "Authorization: Bearer $ADMIN_TOKEN" | jq '.data[] | {amount, category, description}'
echo ""

# 11. Create a New Record
print_header "Create New Financial Record"
CREATE_RESPONSE=$(curl -s -X POST "$BASE_URL/records" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $ADMIN_TOKEN" \
  -d '{
    "user_id": 1,
    "amount": 2500.00,
    "type": "income",
    "category": "Bonus",
    "date": "2024-04-02",
    "description": "Q1 Performance bonus"
  }')
echo "$CREATE_RESPONSE" | jq .
echo ""

# 12. Test Validation (Should Fail)
print_header "Test Validation (Invalid Data)"
curl -s -X POST "$BASE_URL/records" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $ADMIN_TOKEN" \
  -d '{
    "user_id": 1,
    "amount": -100,
    "type": "invalid",
    "category": "",
    "date": "not-a-date"
  }' | jq '.error, .details'
echo ""

# 13. Login as Viewer and Test Permissions
print_header "Viewer Role - Access Dashboard (Should Work)"
VIEWER_RESPONSE=$(curl -s -X POST "$BASE_URL/auth/login" \
  -H "Content-Type: application/json" \
  -d '{"username":"viewer1","password":"password123"}')
VIEWER_TOKEN=$(echo "$VIEWER_RESPONSE" | jq -r '.data.token')

curl -s "$BASE_URL/dashboard/my-summary" \
  -H "Authorization: Bearer $VIEWER_TOKEN" | jq .
echo ""

print_header "Viewer Role - Try to Create Record (Should Fail)"
curl -s -X POST "$BASE_URL/records" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $VIEWER_TOKEN" \
  -d '{
    "user_id": 1,
    "amount": 100,
    "type": "expense",
    "category": "Test",
    "date": "2024-04-02"
  }' | jq '.error'
echo ""

# 14. Unauthorized Access Test
print_header "Unauthorized Access (No Token)"
curl -s "$BASE_URL/users" | jq '.error'
echo ""

# 15. Invalid Login Test
print_header "Invalid Login Credentials"
curl -s -X POST "$BASE_URL/auth/login" \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"wrongpassword"}' | jq '.error'
echo ""

echo "=============================================="
echo "✅ All Quick Tests Completed!"
echo "=============================================="
