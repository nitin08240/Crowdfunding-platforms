const axios = require('axios');

async function testDonationFlow() {
  const API_URL = 'http://localhost:5000/api/v1';
  let token = '';
  let userId = '';
  let campaignId = '';
  let orderId = '';
  let paymentId = 'pay_mock_' + Date.now();

  try {
    console.log('1. Registering test user...');
    const email = `testuser_${Date.now()}@example.com`;
    const regRes = await axios.post(`${API_URL}/auth/register`, {
      name: 'Test User',
      email: email,
      password: 'Password123!',
    });
    token = regRes.data.data.accessToken;
    userId = regRes.data.data.user._id;
    console.log('User created:', userId);

    console.log('\n2. Fetching active campaigns...');
    const listRes = await axios.get(`${API_URL}/campaigns?limit=1`);
    if (listRes.data.data.campaigns.length > 0) {
      campaignId = listRes.data.data.campaigns[0]._id;
      console.log('Found active campaign:', campaignId);
    } else {
      console.log('No active campaigns found. Cannot test donation.');
      return;
    }

    console.log('\n3. Creating order...');
    const orderRes = await axios.post(
      `${API_URL}/payments/create-order`,
      { campaignId, amount: 500, isAnonymous: false, message: 'Test donation' },
      { headers: { Authorization: `Bearer ${token}` } }
    );
    orderId = orderRes.data.data.order.id;
    console.log('Order created:', orderId);
    console.log('Donation created (status):', orderRes.data.data.donation.status);

    console.log('\n4. Verifying payment...');
    const verifyRes = await axios.post(
      `${API_URL}/payments/verify`,
      {
        razorpayOrderId: orderId,
        razorpayPaymentId: paymentId,
        razorpaySignature: 'mock_signature',
      },
      { headers: { Authorization: `Bearer ${token}` } }
    );
    console.log('Verify response status:', verifyRes.data.success);
    console.log('Verify response donation status:', verifyRes.data.data.donation.status);

    console.log('\n5. Checking User Dashboard Stats...');
    const statsRes = await axios.get(`${API_URL}/donations/me/stats`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    console.log('Dashboard Stats:', statsRes.data.data.stats);

    console.log('\n6. Checking Campaign Stats...');
    const campFinalRes = await axios.get(`${API_URL}/campaigns/${listRes.data.data.campaigns[0].slug}`);
    console.log('Campaign Raised Amount:', campFinalRes.data.data.campaign.raisedAmount);
    console.log('Campaign Donor Count:', campFinalRes.data.data.campaign.donorCount);
    
    console.log('\n7. Checking Donation History...');
    const historyRes = await axios.get(`${API_URL}/donations/history`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    console.log('Donation History Count:', historyRes.data.data.donations.length);

  } catch (err) {
    console.error('ERROR:', err.response?.data || err.message);
  }
}

testDonationFlow();
