import http from 'http';

const BASE_URL = 'http://localhost:3000/api/';
let authToken = '';

// Helper function to make HTTP requests
function request(method, path, body = null, token = null) {
  return new Promise((resolve, reject) => {
    // Remove leading slash if present to avoid double slashes
    const cleanPath = path.startsWith('/') ? path.slice(1) : path;
    const url = new URL(cleanPath, BASE_URL);
    const options = {
      hostname: url.hostname,
      port: url.port,
      path: url.pathname + url.search,
      method: method,
      headers: {
        'Content-Type': 'application/json'
      }
    };

    if (token) {
      options.headers['Authorization'] = `Bearer ${token}`;
    }

    const req = http.request(options, (res) => {
      let data = '';
      
      res.on('data', (chunk) => {
        data += chunk;
      });
      
      res.on('end', () => {
        try {
          const jsonData = JSON.parse(data);
          resolve({
            statusCode: res.statusCode,
            headers: res.headers,
            data: jsonData
          });
        } catch (e) {
          resolve({
            statusCode: res.statusCode,
            headers: res.headers,
            data: data
          });
        }
      });
    });

    req.on('error', (e) => {
      reject(e);
    });

    if (body) {
      req.write(JSON.stringify(body));
    }

    req.end();
  });
}

// Test functions
async function testHealthCheck() {
  console.log('\n📋 Testing Health Check...');
  const res = await request('GET', '/health');
  console.log(`Status: ${res.statusCode}`);
  console.log(`Response: ${JSON.stringify(res.data, null, 2)}`);
  return res.statusCode === 200;
}

async function testLogin() {
  console.log('\n🔐 Testing Login...');
  const res = await request('POST', '/auth/login', {
    username: 'admin',
    password: 'admin123'
  });
  
  console.log(`Status: ${res.statusCode}`);
  if (res.data.success && res.data.data.token) {
    authToken = res.data.data.token;
    console.log('✅ Login successful! Token received.');
    console.log(`User: ${res.data.data.user.username} (${res.data.data.user.role})`);
    return true;
  }
  console.log('❌ Login failed!');
  console.log(`Response: ${JSON.stringify(res.data, null, 2)}`);
  return false;
}

async function testGetCurrentUser() {
  console.log('\n👤 Testing Get Current User...');
  const res = await request('GET', '/auth/me', null, authToken);
  console.log(`Status: ${res.statusCode}`);
  console.log(`Response: ${JSON.stringify(res.data, null, 2)}`);
  return res.statusCode === 200;
}

async function testGetRoles() {
  console.log('\n🎭 Testing Get Roles (Admin only)...');
  const res = await request('GET', '/users/roles', null, authToken);
  console.log(`Status: ${res.statusCode}`);
  if (res.data.success) {
    console.log(`✅ Found ${res.data.count} roles:`);
    res.data.data.forEach(role => {
      console.log(`   - ${role.name}: ${role.description}`);
    });
    return true;
  }
  console.log(`Response: ${JSON.stringify(res.data, null, 2)}`);
  return false;
}

async function testGetUsers() {
  console.log('\n👥 Testing Get All Users...');
  const res = await request('GET', '/users', null, authToken);
  console.log(`Status: ${res.statusCode}`);
  if (res.data.success) {
    console.log(`✅ Found ${res.data.count} users:`);
    res.data.data.forEach(user => {
      console.log(`   - ${user.username} (${user.email}) - ${user.role_name} - ${user.status}`);
    });
    return true;
  }
  console.log(`Response: ${JSON.stringify(res.data, null, 2)}`);
  return false;
}

async function testCreateUser() {
  console.log('\n➕ Testing Create New User...');
  const res = await request('POST', '/users', {
    username: `testuser_${Date.now()}`,
    email: `test${Date.now()}@example.com`,
    password: 'testpass123',
    role_id: 2 // Analyst role
  }, authToken);
  
  console.log(`Status: ${res.statusCode}`);
  if (res.data.success) {
    console.log('✅ User created successfully!');
    console.log(`Response: ${JSON.stringify(res.data.data, null, 2)}`);
    return true;
  }
  console.log(`Response: ${JSON.stringify(res.data, null, 2)}`);
  return false;
}

async function testGetRecords() {
  console.log('\n📊 Testing Get Financial Records...');
  const res = await request('GET', '/records?limit=5', null, authToken);
  console.log(`Status: ${res.statusCode}`);
  if (res.data.success) {
    console.log(`✅ Found ${res.data.count} records (showing first 5):`);
    res.data.data.forEach(record => {
      console.log(`   - $${record.amount} (${record.type}) - ${record.category} - ${record.date}`);
    });
    return true;
  }
  console.log(`Response: ${JSON.stringify(res.data, null, 2)}`);
  return false;
}

async function testFilterRecords() {
  console.log('\n🔍 Testing Filter Records by Type...');
  const res = await request('GET', '/records?type=expense&limit=3', null, authToken);
  console.log(`Status: ${res.statusCode}`);
  if (res.data.success) {
    console.log(`✅ Found ${res.data.count} expense records:`);
    res.data.data.forEach(record => {
      console.log(`   - $${record.amount} - ${record.category}`);
    });
    return true;
  }
  console.log(`Response: ${JSON.stringify(res.data, null, 2)}`);
  return false;
}

async function testCreateRecord() {
  console.log('\n➕ Testing Create Financial Record...');
  const res = await request('POST', '/records', {
    user_id: 1,
    amount: 1500.00,
    type: 'income',
    category: 'Freelance',
    date: '2024-04-01',
    description: 'Test freelance project'
  }, authToken);
  
  console.log(`Status: ${res.statusCode}`);
  if (res.data.success) {
    console.log('✅ Record created successfully!');
    console.log(`Response: ${JSON.stringify(res.data.data, null, 2)}`);
    return true;
  }
  console.log(`Response: ${JSON.stringify(res.data, null, 2)}`);
  return false;
}

async function testDashboardSummary() {
  console.log('\n📈 Testing Dashboard Summary...');
  const res = await request('GET', '/dashboard/summary', null, authToken);
  console.log(`Status: ${res.statusCode}`);
  if (res.data.success) {
    console.log('✅ Dashboard Summary:');
    console.log(`   Total Income:  $${res.data.data.total_income}`);
    console.log(`   Total Expense: $${res.data.data.total_expense}`);
    console.log(`   Net Balance:   $${res.data.data.net_balance}`);
    return true;
  }
  console.log(`Response: ${JSON.stringify(res.data, null, 2)}`);
  return false;
}

async function testCategoryTotals() {
  console.log('\n📊 Testing Category Totals...');
  const res = await request('GET', '/dashboard/category-totals', null, authToken);
  console.log(`Status: ${res.statusCode}`);
  if (res.data.success) {
    console.log(`✅ Found ${res.data.count} categories:`);
    res.data.data.slice(0, 5).forEach(cat => {
      console.log(`   ${cat.category}: Income=$${cat.income}, Expense=$${cat.expense}`);
    });
    return true;
  }
  console.log(`Response: ${JSON.stringify(res.data, null, 2)}`);
  return false;
}

async function testMonthlyTrends() {
  console.log('\n📉 Testing Monthly Trends...');
  const res = await request('GET', '/dashboard/monthly-trends?months=3', null, authToken);
  console.log(`Status: ${res.statusCode}`);
  if (res.data.success) {
    console.log('✅ Monthly Trends (last 3 months):');
    res.data.data.forEach(trend => {
      console.log(`   ${trend.month}: Income=$${trend.income}, Expense=$${trend.expense}`);
    });
    return true;
  }
  console.log(`Response: ${JSON.stringify(res.data, null, 2)}`);
  return false;
}

async function testRecentActivity() {
  console.log('\n🔔 Testing Recent Activity...');
  const res = await request('GET', '/dashboard/recent-activity?limit=5', null, authToken);
  console.log(`Status: ${res.statusCode}`);
  if (res.data.success) {
    console.log('✅ Recent Activity:');
    res.data.data.forEach(activity => {
      console.log(`   ${activity.user_name}: $${activity.amount} (${activity.type}) - ${activity.category}`);
    });
    return true;
  }
  console.log(`Response: ${JSON.stringify(res.data, null, 2)}`);
  return false;
}

async function testUnauthorizedAccess() {
  console.log('\n🚫 Testing Unauthorized Access (no token)...');
  const res = await request('GET', '/users', null, null);
  console.log(`Status: ${res.statusCode}`);
  if (res.statusCode === 401) {
    console.log('✅ Correctly blocked unauthorized access!');
    console.log(`Response: ${JSON.stringify(res.data, null, 2)}`);
    return true;
  }
  console.log('❌ Should have returned 401 Unauthorized');
  return false;
}

async function testInvalidLogin() {
  console.log('\n❌ Testing Invalid Login...');
  const res = await request('POST', '/auth/login', {
    username: 'admin',
    password: 'wrongpassword'
  });
  console.log(`Status: ${res.statusCode}`);
  if (res.statusCode === 401) {
    console.log('✅ Correctly rejected invalid credentials!');
    console.log(`Response: ${JSON.stringify(res.data, null, 2)}`);
    return true;
  }
  console.log('❌ Should have returned 401 Unauthorized');
  return false;
}

async function testValidation() {
  console.log('\n✅ Testing Input Validation...');
  const res = await request('POST', '/records', {
    user_id: 1,
    amount: -100, // Invalid negative amount
    type: 'invalid', // Invalid type
    category: '',
    date: 'not-a-date'
  }, authToken);
  
  console.log(`Status: ${res.statusCode}`);
  if (res.statusCode === 400) {
    console.log('✅ Correctly validated input and rejected bad data!');
    console.log(`Errors: ${JSON.stringify(res.data.details || res.data.error, null, 2)}`);
    return true;
  }
  console.log('❌ Should have returned 400 Bad Request');
  return false;
}

async function testViewerRole() {
  console.log('\n👁️ Testing Viewer Role Permissions...');
  
  // Login as viewer
  const loginRes = await request('POST', '/auth/login', {
    username: 'viewer1',
    password: 'password123'
  });
  
  if (!loginRes.data.success) {
    console.log('❌ Could not login as viewer');
    return false;
  }
  
  const viewerToken = loginRes.data.data.token;
  console.log('✅ Logged in as viewer');
  
  // Try to access dashboard (should work)
  const dashboardRes = await request('GET', '/dashboard/my-summary', null, viewerToken);
  console.log(`Viewer accessing dashboard: ${dashboardRes.statusCode}`);
  
  // Try to create record (should fail)
  const createRecordRes = await request('POST', '/records', {
    user_id: 1,
    amount: 100,
    type: 'expense',
    category: 'Test',
    date: '2024-04-01',
    description: 'Should fail'
  }, viewerToken);
  
  console.log(`Viewer trying to create record: ${createRecordRes.statusCode}`);
  
  if (createRecordRes.statusCode === 403) {
    console.log('✅ Viewer correctly blocked from creating records!');
    return true;
  }
  
  console.log('❌ Viewer should have been blocked');
  return false;
}

// Main test runner
async function runTests() {
  console.log('='.repeat(60));
  console.log('🧪 FINANCE BACKEND API TEST SUITE');
  console.log('='.repeat(60));
  
  const results = {
    passed: 0,
    failed: 0,
    tests: []
  };
  
  const tests = [
    { name: 'Health Check', fn: testHealthCheck },
    { name: 'Valid Login', fn: testLogin },
    { name: 'Get Current User', fn: testGetCurrentUser },
    { name: 'Invalid Login', fn: testInvalidLogin },
    { name: 'Unauthorized Access', fn: testUnauthorizedAccess },
    { name: 'Get Roles', fn: testGetRoles },
    { name: 'Get All Users', fn: testGetUsers },
    { name: 'Create User', fn: testCreateUser },
    { name: 'Get Financial Records', fn: testGetRecords },
    { name: 'Filter Records', fn: testFilterRecords },
    { name: 'Create Record', fn: testCreateRecord },
    { name: 'Input Validation', fn: testValidation },
    { name: 'Dashboard Summary', fn: testDashboardSummary },
    { name: 'Category Totals', fn: testCategoryTotals },
    { name: 'Monthly Trends', fn: testMonthlyTrends },
    { name: 'Recent Activity', fn: testRecentActivity },
    { name: 'Viewer Permissions', fn: testViewerRole }
  ];
  
  for (const test of tests) {
    try {
      const passed = await test.fn();
      results.tests.push({ name: test.name, passed });
      if (passed) {
        results.passed++;
      } else {
        results.failed++;
      }
    } catch (error) {
      console.log(`\n❌ Test "${test.name}" failed with error: ${error.message}`);
      results.tests.push({ name: test.name, passed: false, error: error.message });
      results.failed++;
    }
    
    // Small delay between tests
    await new Promise(resolve => setTimeout(resolve, 300));
  }
  
  // Print summary
  console.log('\n' + '='.repeat(60));
  console.log('📊 TEST SUMMARY');
  console.log('='.repeat(60));
  console.log(`Total Tests: ${results.tests.length}`);
  console.log(`Passed: ${results.passed} ✅`);
  console.log(`Failed: ${results.failed} ❌`);
  console.log('='.repeat(60));
  
  if (results.failed === 0) {
    console.log('\n🎉 ALL TESTS PASSED! 🎉\n');
  } else {
    console.log('\n⚠️  Some tests failed. Review the output above.\n');
  }
  
  process.exit(results.failed === 0 ? 0 : 1);
}

// Run tests
runTests().catch(error => {
  console.error('Test suite failed:', error);
  process.exit(1);
});
