import fs from 'fs';

const BASE_URL = 'http://localhost:3000';

const customerUser = {
    email: 'verify.customer@example.com',
    password: 'VerifyPass123!',
    name: 'Verify Customer',
};

const sellerUser = {
    email: 'verify.seller@example.com',
    password: 'VerifyPass123!',
    name: 'Verify Seller',
};

async function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

async function run() {
    const results = [];
    let customerTokens = {};
    let sellerTokens = {};
    let addressId = '';

    const addTestResult = (num, category, method, endpoint, expected, actual, body) => {
        const isPass = actual === expected || 
                       (expected === '401 or 403' && (actual === 401 || actual === 403)) || 
                       (expected === '400 or 409' && (actual === 400 || actual === 409));
        const status = isPass ? '✅ PASS' : '❌ FAIL';
        const record = {
            num,
            category,
            method,
            endpoint,
            expected,
            actual,
            status,
            body: JSON.stringify(body),
        };
        results.push(record);
        console.log(`Test ${num}: ${method} ${endpoint} - Expected: ${expected}, Actual: ${actual} [${status}]`);
        return isPass;
    };

    console.log('Starting API Tests with 7-second delays to avoid rate limit...');

    // Test 1: GET /health
    try {
        const res = await fetch(`${BASE_URL}/health`);
        const body = await res.json();
        addTestResult(1, 'Health', 'GET', '/health', 200, res.status, body);
    } catch (e) {
        addTestResult(1, 'Health', 'GET', '/health', 200, 'ERROR', { error: e.message });
    }
    await sleep(7000);

    // Test 2: POST /api/v1/auth/register (customer)
    try {
        const res = await fetch(`${BASE_URL}/api/v1/auth/register`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(customerUser),
        });
        const body = await res.json();
        addTestResult(2, 'Auth', 'POST', '/api/v1/auth/register', 201, res.status, body);
    } catch (e) {
        addTestResult(2, 'Auth', 'POST', '/api/v1/auth/register', 201, 'ERROR', { error: e.message });
    }
    await sleep(7000);

    // Test 3: POST /api/v1/auth/register (duplicate customer)
    try {
        const res = await fetch(`${BASE_URL}/api/v1/auth/register`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(customerUser),
        });
        const body = await res.json();
        addTestResult(3, 'Auth', 'POST', '/api/v1/auth/register', 409, res.status, body);
    } catch (e) {
        addTestResult(3, 'Auth', 'POST', '/api/v1/auth/register', 409, 'ERROR', { error: e.message });
    }
    await sleep(7000);

    // Test 4: POST /api/v1/auth/register (seller)
    try {
        const res = await fetch(`${BASE_URL}/api/v1/auth/register`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(sellerUser),
        });
        const body = await res.json();
        addTestResult(4, 'Auth', 'POST', '/api/v1/auth/register', 201, res.status, body);
    } catch (e) {
        addTestResult(4, 'Auth', 'POST', '/api/v1/auth/register', 201, 'ERROR', { error: e.message });
    }
    await sleep(7000);

    // Test 5: POST /api/v1/auth/login (customer)
    try {
        const res = await fetch(`${BASE_URL}/api/v1/auth/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email: customerUser.email, password: customerUser.password }),
        });
        const body = await res.json();
        if (res.status === 200 && body.data) {
            customerTokens = {
                accessToken: body.data.accessToken,
                refreshToken: body.data.refreshToken,
            };
        }
        addTestResult(5, 'Auth', 'POST', '/api/v1/auth/login', 200, res.status, body);
    } catch (e) {
        addTestResult(5, 'Auth', 'POST', '/api/v1/auth/login', 200, 'ERROR', { error: e.message });
    }
    await sleep(7000);

    // Test 6: POST /api/v1/auth/login (customer wrong password)
    try {
        const res = await fetch(`${BASE_URL}/api/v1/auth/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email: customerUser.email, password: 'wrongpassword' }),
        });
        const body = await res.json();
        addTestResult(6, 'Auth', 'POST', '/api/v1/auth/login', 401, res.status, body);
    } catch (e) {
        addTestResult(6, 'Auth', 'POST', '/api/v1/auth/login', 401, 'ERROR', { error: e.message });
    }
    await sleep(7000);

    // Test 7: GET /api/v1/auth/me (customer)
    try {
        const res = await fetch(`${BASE_URL}/api/v1/auth/me`, {
            headers: { 'Authorization': `Bearer ${customerTokens.accessToken}` },
        });
        const body = await res.json();
        addTestResult(7, 'Auth', 'GET', '/api/v1/auth/me', 200, res.status, body);
    } catch (e) {
        addTestResult(7, 'Auth', 'GET', '/api/v1/auth/me', 200, 'ERROR', { error: e.message });
    }
    await sleep(7000);

    // Test 8: POST /api/v1/auth/refresh (rotate token)
    let newCustomerTokens = {};
    try {
        const res = await fetch(`${BASE_URL}/api/v1/auth/refresh`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ refreshToken: customerTokens.refreshToken }),
        });
        const body = await res.json();
        if (res.status === 200 && body.data) {
            newCustomerTokens = {
                accessToken: body.data.accessToken,
                refreshToken: body.data.refreshToken,
            };
        }
        addTestResult(8, 'Auth', 'POST', '/api/v1/auth/refresh', 200, res.status, body);
    } catch (e) {
        addTestResult(8, 'Auth', 'POST', '/api/v1/auth/refresh', 200, 'ERROR', { error: e.message });
    }
    await sleep(7000);

    // Test 9: POST /api/v1/auth/refresh (use old/revoked token)
    try {
        const res = await fetch(`${BASE_URL}/api/v1/auth/refresh`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ refreshToken: customerTokens.refreshToken }),
        });
        const body = await res.json();
        addTestResult(9, 'Auth', 'POST', '/api/v1/auth/refresh', 401, res.status, body);
    } catch (e) {
        addTestResult(9, 'Auth', 'POST', '/api/v1/auth/refresh', 401, 'ERROR', { error: e.message });
    }
    await sleep(7000);

    // Update customerTokens to the rotated ones
    if (newCustomerTokens.accessToken) {
        customerTokens = newCustomerTokens;
    }

    // Test 10: POST /api/v1/auth/logout (customer)
    try {
        const res = await fetch(`${BASE_URL}/api/v1/auth/logout`, {
            method: 'POST',
            headers: { 'Authorization': `Bearer ${customerTokens.accessToken}` },
        });
        let body = {};
        try {
            body = await res.json();
        } catch {
            body = { error: 'No JSON response body' };
        }
        addTestResult(10, 'Auth', 'POST', '/api/v1/auth/logout', 200, res.status, body);
    } catch (e) {
        addTestResult(10, 'Auth', 'POST', '/api/v1/auth/logout', 200, 'ERROR', { error: e.message });
    }
    await sleep(7000);

    // Test 11: POST /api/v1/auth/login (re-login customer after logout)
    try {
        const res = await fetch(`${BASE_URL}/api/v1/auth/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email: customerUser.email, password: customerUser.password }),
        });
        const body = await res.json();
        if (res.status === 200 && body.data) {
            customerTokens = {
                accessToken: body.data.accessToken,
                refreshToken: body.data.refreshToken,
            };
        }
        addTestResult(11, 'Auth', 'POST', '/api/v1/auth/login', 200, res.status, body);
    } catch (e) {
        addTestResult(11, 'Auth', 'POST', '/api/v1/auth/login', 200, 'ERROR', { error: e.message });
    }
    await sleep(7000);

    // Test 12: GET /api/v1/users/me (profile)
    try {
        const res = await fetch(`${BASE_URL}/api/v1/users/me`, {
            headers: { 'Authorization': `Bearer ${customerTokens.accessToken}` },
        });
        const body = await res.json();
        addTestResult(12, 'Users', 'GET', '/api/v1/users/me', 200, res.status, body);
    } catch (e) {
        addTestResult(12, 'Users', 'GET', '/api/v1/users/me', 200, 'ERROR', { error: e.message });
    }
    await sleep(7000);

    // Test 13: PATCH /api/v1/users/me (update name)
    try {
        const res = await fetch(`${BASE_URL}/api/v1/users/me`, {
            method: 'PATCH',
            headers: { 
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${customerTokens.accessToken}`
            },
            body: JSON.stringify({ name: 'Verified Customer' }),
        });
        const body = await res.json();
        addTestResult(13, 'Users', 'PATCH', '/api/v1/users/me', 200, res.status, body);
    } catch (e) {
        addTestResult(13, 'Users', 'PATCH', '/api/v1/users/me', 200, 'ERROR', { error: e.message });
    }
    await sleep(7000);

    // Test 14: POST /api/v1/users/me/address (add address)
    const addressPayload = {
        label: 'Home',
        street: '123 Verified St',
        city: 'Hyderabad',
        state: 'Telangana',
        zipCode: '500081',
        country: 'INDIA',
        isDefault: true
    };
    try {
        const res = await fetch(`${BASE_URL}/api/v1/users/me/address`, {
            method: 'POST',
            headers: { 
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${customerTokens.accessToken}`
            },
            body: JSON.stringify(addressPayload),
        });
        const body = await res.json();
        addTestResult(14, 'Users', 'POST', '/api/v1/users/me/address', 200, res.status, body);
    } catch (e) {
        addTestResult(14, 'Users', 'POST', '/api/v1/users/me/address', 200, 'ERROR', { error: e.message });
    }
    await sleep(7000);

    // Test 15: GET /api/v1/users/me/address (list)
    try {
        const res = await fetch(`${BASE_URL}/api/v1/users/me/address`, {
            headers: { 'Authorization': `Bearer ${customerTokens.accessToken}` },
        });
        const body = await res.json();
        if (res.status === 200 && body.data && body.data.length > 0) {
            addressId = body.data[0].id;
        }
        addTestResult(15, 'Users', 'GET', '/api/v1/users/me/address', 200, res.status, body);
    } catch (e) {
        addTestResult(15, 'Users', 'GET', '/api/v1/users/me/address', 200, 'ERROR', { error: e.message });
    }
    await sleep(7000);

    // Test 16: PATCH /api/v1/users/me/address/:id (update address)
    try {
        const res = await fetch(`${BASE_URL}/api/v1/users/me/address/${addressId}`, {
            method: 'PATCH',
            headers: { 
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${customerTokens.accessToken}`
            },
            body: JSON.stringify({ ...addressPayload, city: 'Bengaluru' }),
        });
        const body = await res.json();
        addTestResult(16, 'Users', 'PATCH', `/api/v1/users/me/address/${addressId}`, 200, res.status, body);
    } catch (e) {
        addTestResult(16, 'Users', 'PATCH', `/api/v1/users/me/address/${addressId}`, 200, 'ERROR', { error: e.message });
    }
    await sleep(7000);

    // Test 17: DELETE /api/v1/users/me/address/:id (delete address)
    try {
        const res = await fetch(`${BASE_URL}/api/v1/users/me/address/${addressId}`, {
            method: 'DELETE',
            headers: { 'Authorization': `Bearer ${customerTokens.accessToken}` },
        });
        const body = await res.json();
        addTestResult(17, 'Users', 'DELETE', `/api/v1/users/me/address/${addressId}`, 200, res.status, body);
    } catch (e) {
        addTestResult(17, 'Users', 'DELETE', `/api/v1/users/me/address/${addressId}`, 200, 'ERROR', { error: e.message });
    }
    await sleep(7000);

    // Test 18: Login as seller user
    try {
        const res = await fetch(`${BASE_URL}/api/v1/auth/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email: sellerUser.email, password: sellerUser.password }),
        });
        const body = await res.json();
        if (res.status === 200 && body.data) {
            sellerTokens = {
                accessToken: body.data.accessToken,
                refreshToken: body.data.refreshToken,
            };
        }
        addTestResult(18, 'Seller Onboarding', 'POST', '/api/v1/auth/login', 200, res.status, body);
    } catch (e) {
        addTestResult(18, 'Seller Onboarding', 'POST', '/api/v1/auth/login', 200, 'ERROR', { error: e.message });
    }
    await sleep(7000);

    // Test 19: POST /api/v1/users/me/become-seller
    try {
        const res = await fetch(`${BASE_URL}/api/v1/users/me/become-seller`, {
            method: 'POST',
            headers: { 'Authorization': `Bearer ${sellerTokens.accessToken}` },
        });
        const body = await res.json();
        addTestResult(19, 'Seller Onboarding', 'POST', '/api/v1/users/me/become-seller', 200, res.status, body);
    } catch (e) {
        addTestResult(19, 'Seller Onboarding', 'POST', '/api/v1/users/me/become-seller', 200, 'ERROR', { error: e.message });
    }
    await sleep(7000);

    // Test 20: POST /api/v1/users/me/become-seller (again)
    try {
        const res = await fetch(`${BASE_URL}/api/v1/users/me/become-seller`, {
            method: 'POST',
            headers: { 'Authorization': `Bearer ${sellerTokens.accessToken}` },
        });
        const body = await res.json();
        addTestResult(20, 'Seller Onboarding', 'POST', '/api/v1/users/me/become-seller', '400 or 409', res.status, body);
    } catch (e) {
        addTestResult(20, 'Seller Onboarding', 'POST', '/api/v1/users/me/become-seller', '400 or 409', 'ERROR', { error: e.message });
    }
    await sleep(7000);

    // Test 21: Login as customer again to soft delete
    try {
        const res = await fetch(`${BASE_URL}/api/v1/auth/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email: customerUser.email, password: customerUser.password }),
        });
        const body = await res.json();
        if (res.status === 200 && body.data) {
            customerTokens = {
                accessToken: body.data.accessToken,
                refreshToken: body.data.refreshToken,
            };
        }
        addTestResult(21, 'Auth', 'POST', '/api/v1/auth/login', 200, res.status, body);
    } catch (e) {
        addTestResult(21, 'Auth', 'POST', '/api/v1/auth/login', 200, 'ERROR', { error: e.message });
    }
    await sleep(7000);

    // Test 22: DELETE /api/v1/users/me (soft delete)
    try {
        const res = await fetch(`${BASE_URL}/api/v1/users/me`, {
            method: 'DELETE',
            headers: { 'Authorization': `Bearer ${customerTokens.accessToken}` },
        });
        const body = await res.json();
        addTestResult(22, 'Users', 'DELETE', '/api/v1/users/me', 200, res.status, body);
    } catch (e) {
        addTestResult(22, 'Users', 'DELETE', '/api/v1/users/me', 200, 'ERROR', { error: e.message });
    }
    await sleep(7000);

    // Test 23: POST /api/v1/auth/login (try login with deleted account)
    try {
        const res = await fetch(`${BASE_URL}/api/v1/auth/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email: customerUser.email, password: customerUser.password }),
        });
        const body = await res.json();
        addTestResult(23, 'Auth', 'POST', '/api/v1/auth/login', '401 or 403', res.status, body);
    } catch (e) {
        addTestResult(23, 'Auth', 'POST', '/api/v1/auth/login', '401 or 403', 'ERROR', { error: e.message });
    }
    await sleep(7000);

    // Test 24: GET /api/v1/admin/users — with customer token (using seller token)
    try {
        const res = await fetch(`${BASE_URL}/api/v1/admin/users`, {
            headers: { 'Authorization': `Bearer ${sellerTokens.accessToken}` },
        });
        const body = await res.json();
        addTestResult(24, 'Admin Access Control', 'GET', '/api/v1/admin/users', 403, res.status, body);
    } catch (e) {
        addTestResult(24, 'Admin Access Control', 'GET', '/api/v1/admin/users', 403, 'ERROR', { error: e.message });
    }
    await sleep(7000);

    // Test 25: PATCH /api/v1/admin/users/:id/role — with customer token
    try {
        const res = await fetch(`${BASE_URL}/api/v1/admin/users/6a168027bb958853bcd02094/role`, {
            method: 'PATCH',
            headers: { 
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${sellerTokens.accessToken}`
            },
            body: JSON.stringify({ role: 'ADMIN' }),
        });
        const body = await res.json();
        addTestResult(25, 'Admin Access Control', 'PATCH', '/api/v1/admin/users/6a168027bb958853bcd02094/role', 403, res.status, body);
    } catch (e) {
        addTestResult(25, 'Admin Access Control', 'PATCH', '/api/v1/admin/users/6a168027bb958853bcd02094/role', 403, 'ERROR', { error: e.message });
    }
    await sleep(7000);

    // Test 26: DELETE /api/v1/admin/users/:id — with customer token
    try {
        const res = await fetch(`${BASE_URL}/api/v1/admin/users/6a168027bb958853bcd02094`, {
            method: 'DELETE',
            headers: { 'Authorization': `Bearer ${sellerTokens.accessToken}` },
        });
        const body = await res.json();
        addTestResult(26, 'Admin Access Control', 'DELETE', '/api/v1/admin/users/6a168027bb958853bcd02094', 403, res.status, body);
    } catch (e) {
        addTestResult(26, 'Admin Access Control', 'DELETE', '/api/v1/admin/users/6a168027bb958853bcd02094', 403, 'ERROR', { error: e.message });
    }

    // Write results to JSON file
    fs.writeFileSync('./test/manual/reports/api-test-results.json', JSON.stringify(results, null, 2));
    console.log('Results written to ./test/manual/reports/api-test-results.json');
}

run();
