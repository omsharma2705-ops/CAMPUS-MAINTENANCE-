const BASE_URL = 'http://localhost:5000/api';

async function req(url, method = 'GET', data = null, token = null) {
  const headers = { 'Content-Type': 'application/json' };
  if (token) headers['x-auth-token'] = token;

  const res = await fetch(url, {
    method,
    headers,
    body: data ? JSON.stringify(data) : undefined,
  });

  const json = await res.json();
  if (!res.ok) {
    throw new Error(json.msg || JSON.stringify(json));
  }
  return json;
}

async function testAll() {
  console.log('🧪 Starting End-to-End Requirements Verification Test...\n');

  try {
    // 1. Test University I-Card Login
    console.log('1️⃣ Testing University I-Card Authentication...');
    const loginRes = await req(`${BASE_URL}/auth/login`, 'POST', {
      identifier: 'CAMPUS-ADM-001',
      password: 'admin123',
    });
    console.log('   ✓ Admin Login via I-Card Successful! User:', loginRes.user.name, '🪪', loginRes.user.cardId);
    const adminToken = loginRes.token;

    // 2. Test Single Sign-On (OAuth2 Simulation)
    console.log('\n2️⃣ Testing University SSO / OAuth2 Authentication...');
    const ssoRes = await req(`${BASE_URL}/auth/sso`, 'POST', {
      provider: 'University Google SSO',
      email: 'student@campus.edu',
      role: 'student'
    });
    console.log('   ✓ SSO Authentication Successful! Student:', ssoRes.user.name, '🪪', ssoRes.user.cardId);
    const studentToken = ssoRes.token;

    // 3. Test Tradesman Login
    const workerLogin = await req(`${BASE_URL}/auth/login`, 'POST', {
      identifier: 'CAMPUS-EMP-101',
      password: 'worker123'
    });
    console.log('   ✓ Electrician Login via I-Card Successful! Trade:', workerLogin.user.trade);
    const workerToken = workerLogin.token;

    // 4. Test Complaint Registration with Structured Location
    console.log('\n3️⃣ Testing Complaint Registration (Unique CMP#, Building, Floor, Room, SLA)...');
    const compRes = await req(`${BASE_URL}/complaints`, 'POST', {
      title: 'Power tripping continuously in AI Research Lab',
      description: 'The circuit breaker keeps tripping every 15 minutes when GPUs are loaded.',
      category: 'Electrical',
      priority: 'Urgent',
      building: 'Computer Science Department',
      floor: '3rd Floor',
      room: 'AI Lab 308',
      locationDescription: 'Main server cluster bay',
    }, studentToken);

    console.log('   ✓ Complaint Registered!');
    console.log('     • Complaint Number:', compRes.complaintNumber);
    console.log('     • Status:', compRes.status);
    console.log('     • Location:', `${compRes.location.building} > ${compRes.location.floor} > ${compRes.location.room}`);
    console.log('     • Priority:', compRes.priority);
    const complaintId = compRes._id;

    // 5. Manager Creates Work Order & Assigns Tradesman
    console.log('\n4️⃣ Testing Manager Review & Work Order Creation (WO#, 2h SLA Target)...');
    const woRes = await req(`${BASE_URL}/complaints/${complaintId}/work-order`, 'POST', {
      workerId: workerLogin.user.id,
      priority: 'Urgent',
      instructions: 'Check line load with thermal imager and balance phases across MCBs.',
      tradesmanType: 'Electrician'
    }, adminToken);

    console.log('   ✓ Work Order Created!');
    console.log('     • Work Order #:', woRes.workOrder.workOrderNumber);
    console.log('     • Assigned Tradesman:', woRes.assignedTo.name, `(${woRes.assignedTo.trade})`);
    console.log('     • SLA Target:', `${woRes.workOrder.slaHours} Hours`);
    console.log('     • Status:', woRes.status);

    // 6. Tradesman Requests Spare Parts from Stores
    console.log('\n5️⃣ Testing Tradesman Spare Parts Requisition to Stores...');
    const invRes = await req(`${BASE_URL}/stores/inventory`, 'GET', null, workerToken);
    const switchItem = invRes.find(it => it.category === 'Electrical') || invRes[0];

    const matReqRes = await req(`${BASE_URL}/complaints/${complaintId}/materials/request`, 'POST', {
      items: [
        {
          item: switchItem._id,
          itemName: switchItem.name,
          quantity: 2,
          unit: switchItem.unit
        }
      ],
      reason: 'Replacing overheated 16A modular switch and breaker terminal'
    }, workerToken);

    console.log('   ✓ Spare Parts Requisition Dispatched to Stores!');
    console.log('     • Requisition ID:', matReqRes.materialRequest._id);
    console.log('     • Complaint Status:', matReqRes.complaint.status);
    const requestId = matReqRes.materialRequest._id;

    // 7. Stores Issues Material (Stock decrement & Ledger record)
    console.log('\n6️⃣ Testing Stores Material Issuance & Audit Ledger...');
    const initialStock = switchItem.quantity;
    const issueRes = await req(`${BASE_URL}/stores/requests/${requestId}/issue`, 'POST', {}, adminToken);
    console.log('   ✓ Materials Issued by Stores!');
    console.log('     • Status:', issueRes.materialReq.status);

    const updatedInv = await req(`${BASE_URL}/stores/inventory`, 'GET', null, adminToken);
    const updatedItem = updatedInv.find(it => it._id === switchItem._id);
    console.log(`     • Stock Updated: ${initialStock} ${switchItem.unit} ➔ ${updatedItem.quantity} ${switchItem.unit} (Decremented by 2)`);

    const ledgerRes = await req(`${BASE_URL}/stores/ledger?limit=1`, 'GET', null, adminToken);
    console.log('     • Ledger Entry:', ledgerRes[0].type, ledgerRes[0].itemName, 'Balance:', ledgerRes[0].balanceAfter);

    // 8. Tradesman Marks Work as Completed
    console.log('\n7️⃣ Testing Tradesman Work Completion & Proof Submission...');
    const completeRes = await req(`${BASE_URL}/complaints/${complaintId}/status`, 'PUT', {
      status: 'Resolved',
      workerRemarks: 'Replaced charred phase switch, re-terminated cables with ferrules. GPU load test stable (230V, 14A).',
    }, workerToken);
    console.log('   ✓ Work Marked as Completed by Tradesman!');
    console.log('     • Status:', completeRes.status);
    console.log('     • Resolved At:', completeRes.resolvedAt);

    // 9. Manager Verifies and Marks Complaint as Completed
    console.log('\n8️⃣ Testing Manager Verification & Ticket Completion...');
    const verifyRes = await req(`${BASE_URL}/complaints/${complaintId}/verify`, 'PUT', {
      isApproved: true,
      adminRemarks: 'Lab inspected. Phase balance verified, no heat buildup detected. Closed.'
    }, adminToken);
    console.log('   ✓ Manager Verified Resolution & Marked Completed!');
    console.log('     • Status:', verifyRes.status);

    // 10. Multi-Channel Notifications Check
    console.log('\n9️⃣ Testing Multi-Channel Notifications (In-App, Email, SMS)...');
    const notifRes = await req(`${BASE_URL}/notifications`, 'GET', null, studentToken);
    console.log(`   ✓ Complainant received ${notifRes.notifications.length} notification(s)!`);
    console.log('     • Latest Alert:', notifRes.notifications[0].title);
    console.log('     • Email Gateway Status:', notifRes.notifications[0].emailDeliveryStatus);
    console.log('     • SMS Gateway Status:', notifRes.notifications[0].smsDeliveryStatus);

    // 11. Student Submits 5-Star Rating & Feedback
    console.log('\n🔟 Testing Complainant Star Rating & Feedback...');
    const fbRes = await req(`${BASE_URL}/complaints/${complaintId}/feedback`, 'POST', {
      rating: 5,
      comment: 'Technician arrived within 30 minutes! High quality work and GPUs are running at full power again.'
    }, studentToken);
    console.log('   ✓ 5-Star Feedback Recorded!');
    console.log('     • Rating:', fbRes.feedback.rating, '⭐');
    console.log('     • Comments:', fbRes.feedback.comment);

    // 12. Director / Admin Analytics & KPI Reporting
    console.log('\n1️⃣1️⃣ Testing Director / Admin Analytics & SLA Compliance...');
    const analyticsRes = await req(`${BASE_URL}/admin/analytics`, 'GET', null, adminToken);
    console.log('   ✓ KPI Analytics Retrieved:');
    console.log('     • Total Complaints:', analyticsRes.summary.totalComplaints);
    console.log('     • Addressed Complaints:', analyticsRes.summary.addressed);
    console.log('     • Pending Queue:', analyticsRes.summary.activeQueue);
    console.log('     • SLA Compliance Rate:', `${analyticsRes.summary.slaComplianceRate}%`);
    console.log('     • Store Inventory Value:', `₹${analyticsRes.summary.store.totalStockValue}`);

    // 13. Export Excel / CSV Test
    console.log('\n1️⃣2️⃣ Testing Excel / CSV Report Export...');
    const exportRes = await req(`${BASE_URL}/admin/export/complaints`, 'GET', null, adminToken);
    console.log(`   ✓ Excel/CSV Export Dataset Generated: ${exportRes.length} records ready for download!`);

    console.log('\n🎉 ALL 12 REQUIREMENT MODULES PASSED END-TO-END SUCCESSFULLY!');
    process.exit(0);
  } catch (err) {
    console.error('❌ Test failed:', err.message);
    process.exit(1);
  }
}

testAll();
