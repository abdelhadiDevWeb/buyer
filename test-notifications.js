// Test script to check notification data flow
const axios = require('axios');

const API_BASE_URL = 'http://localhost:3000';
const BUYER_API_KEY = process.env.NEXT_PUBLIC_KEY_API_BYUER || 'your-api-key-here';

async function testNotifications() {
  try {
    console.log('🔍 Testing notification system...');
    
    // 1. Check if server is running
    console.log('\n1. Checking server status...');
    try {
      const healthCheck = await axios.get(`${API_BASE_URL}/notification/debug/all`, {
        headers: {
          'x-access-key': BUYER_API_KEY
        }
      });
      console.log('✅ Server is running');
      console.log('📊 Total notifications in database:', healthCheck.data.total);
      console.log('📋 Sample notifications:', healthCheck.data.notifications.slice(0, 3));
    } catch (error) {
      console.error('❌ Server not running or error:', error.message);
      return;
    }
    
    // 2. Test buyer notifications endpoint
    console.log('\n2. Testing buyer notifications endpoint...');
    try {
      const buyerNotifications = await axios.get(`${API_BASE_URL}/notification/buyer/test-user-id`, {
        headers: {
          'x-access-key': BUYER_API_KEY
        }
      });
      console.log('✅ Buyer notifications endpoint working');
      console.log('📊 Notifications for test user:', buyerNotifications.data.length);
    } catch (error) {
      console.error('❌ Buyer notifications endpoint error:', error.response?.data || error.message);
    }
    
    // 3. Test general notifications endpoint
    console.log('\n3. Testing general notifications endpoint...');
    try {
      const generalNotifications = await axios.get(`${API_BASE_URL}/notification/all`, {
        headers: {
          'x-access-key': BUYER_API_KEY
        }
      });
      console.log('✅ General notifications endpoint working');
      console.log('📊 All notifications:', generalNotifications.data.length);
    } catch (error) {
      console.error('❌ General notifications endpoint error:', error.response?.data || error.message);
    }
    
    // 4. Create a test notification
    console.log('\n4. Creating test notification...');
    try {
      const testNotification = await axios.post(`${API_BASE_URL}/notification`, {
        userId: 'test-user-id',
        type: 'BID_CREATED',
        title: 'Test Notification',
        message: 'This is a test notification to verify the system works',
        data: { test: true }
      }, {
        headers: {
          'x-access-key': BUYER_API_KEY,
          'Content-Type': 'application/json'
        }
      });
      console.log('✅ Test notification created:', testNotification.data);
    } catch (error) {
      console.error('❌ Error creating test notification:', error.response?.data || error.message);
    }
    
    // 5. Check notifications again
    console.log('\n5. Checking notifications after creation...');
    try {
      const updatedNotifications = await axios.get(`${API_BASE_URL}/notification/debug/all`, {
        headers: {
          'x-access-key': BUYER_API_KEY
        }
      });
      console.log('📊 Updated total notifications:', updatedNotifications.data.total);
      console.log('📋 Latest notifications:', updatedNotifications.data.notifications.slice(0, 3));
    } catch (error) {
      console.error('❌ Error checking updated notifications:', error.response?.data || error.message);
    }
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

// Run the test
testNotifications();
