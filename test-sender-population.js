// Test script to verify sender information population
const axios = require('axios');

const DEV_API_BASE_URL = 'http://localhost:3000';
const PROD_API_BASE_URL = 'https://mazadclick-server.onrender.com';
// const LEGACY_API_BASE_URL = 'http://localhost:3000';

const API_BASE_URL = process.env.API_BASE_URL || (process.env.NODE_ENV === 'development' ? DEV_API_BASE_URL : PROD_API_BASE_URL);

const BUYER_API_KEY = process.env.NEXT_PUBLIC_KEY_API_BYUER || 'your-api-key-here';

async function testSenderPopulation() {
  try {
    console.log('🧪 Testing sender information population...');
    
    // First, let's check if there are any existing notifications
    console.log('\n📊 Checking existing notifications...');
    const allNotificationsResponse = await axios.get(`${API_BASE_URL}/notification/debug/all`, {
      headers: {
        'x-access-key': BUYER_API_KEY
      }
    });
    
    console.log('📋 Total notifications in database:', allNotificationsResponse.data.total);
    
    if (allNotificationsResponse.data.notifications.length > 0) {
      const sampleNotification = allNotificationsResponse.data.notifications[0];
      console.log('📋 Sample notification details:');
      console.log('  - ID:', sampleNotification._id);
      console.log('  - Title:', sampleNotification.title);
      console.log('  - Type:', sampleNotification.type);
      console.log('  - SenderId:', sampleNotification.senderId);
      console.log('  - SenderName:', sampleNotification.senderName);
      console.log('  - SenderEmail:', sampleNotification.senderEmail);
      console.log('  - Read:', sampleNotification.read);
    }
    
    // Test the new general notifications endpoint
    console.log('\n🔔 Testing general notifications endpoint...');
    try {
      const generalResponse = await axios.get(`${API_BASE_URL}/notification/general`, {
        headers: {
          'Authorization': `Bearer test-token`,
          'x-access-key': BUYER_API_KEY,
          'Content-Type': 'application/json'
        },
        withCredentials: true
      });
      
      console.log('📊 General notifications response status:', generalResponse.status);
      console.log('📊 General notifications count:', generalResponse.data.notifications?.length || 0);
      
      if (generalResponse.data.notifications && generalResponse.data.notifications.length > 0) {
        const notification = generalResponse.data.notifications[0];
        console.log('📋 First general notification details:');
        console.log('  - ID:', notification._id);
        console.log('  - Title:', notification.title);
        console.log('  - Type:', notification.type);
        console.log('  - SenderId type:', typeof notification.senderId);
        console.log('  - SenderId value:', notification.senderId);
        console.log('  - SenderName:', notification.senderName);
        console.log('  - SenderEmail:', notification.senderEmail);
        console.log('  - Read:', notification.read);
        
        if (typeof notification.senderId === 'object' && notification.senderId !== null) {
          console.log('  - Populated sender data:', notification.senderId);
        }
      } else {
        console.log('❌ No general notifications found');
      }
    } catch (error) {
      console.error('❌ Error testing general notifications:', error.response?.data || error.message);
    }
    
    // Test the new chat notifications endpoint
    console.log('\n💬 Testing chat notifications endpoint...');
    try {
      const chatResponse = await axios.get(`${API_BASE_URL}/notification/chat`, {
        headers: {
          'Authorization': `Bearer test-token`,
          'x-access-key': BUYER_API_KEY,
          'Content-Type': 'application/json'
        },
        withCredentials: true
      });
      
      console.log('📊 Chat notifications response status:', chatResponse.status);
      console.log('📊 Chat notifications count:', chatResponse.data.notifications?.length || 0);
      
      if (chatResponse.data.notifications && chatResponse.data.notifications.length > 0) {
        const notification = chatResponse.data.notifications[0];
        console.log('📋 First chat notification details:');
        console.log('  - ID:', notification._id);
        console.log('  - Title:', notification.title);
        console.log('  - Type:', notification.type);
        console.log('  - SenderId type:', typeof notification.senderId);
        console.log('  - SenderId value:', notification.senderId);
        console.log('  - SenderName:', notification.senderName);
        console.log('  - SenderEmail:', notification.senderEmail);
        console.log('  - Read:', notification.read);
        
        if (typeof notification.senderId === 'object' && notification.senderId !== null) {
          console.log('  - Populated sender data:', notification.senderId);
        }
      } else {
        console.log('❌ No chat notifications found');
      }
    } catch (error) {
      console.error('❌ Error testing chat notifications:', error.response?.data || error.message);
    }
    
    // Create a test notification with a real user ID if we can find one
    console.log('\n🧪 Creating test notification with real user ID...');
    try {
      // Try to find a real user ID from the database
      const usersResponse = await axios.get(`${API_BASE_URL}/user/debug/all`, {
        headers: {
          'x-access-key': BUYER_API_KEY
        }
      });
      
      if (usersResponse.data.users && usersResponse.data.users.length > 0) {
        const testUser = usersResponse.data.users[0];
        console.log('👤 Found test user:', testUser._id, testUser.firstName, testUser.lastName);
        
        // Create a notification with this user as sender
        const testNotification = await axios.post(`${API_BASE_URL}/notification`, {
          userId: 'test-recipient-id',
          type: 'BID_CREATED',
          title: 'Test Notification with Real Sender',
          message: `This notification was created by ${testUser.firstName} ${testUser.lastName}`,
          data: { 
            test: true, 
            auctionId: 'test-auction-123',
            productTitle: 'Test Product'
          },
          read: false,
          senderId: testUser._id // Use real user ID
        }, {
          headers: {
            'x-access-key': BUYER_API_KEY,
            'Content-Type': 'application/json'
          }
        });
        
        console.log('✅ Test notification created with real sender ID:', testNotification.data);
        
        // Now test the general endpoint again to see if it populates the sender
        console.log('\n🔍 Testing general endpoint after creating notification with real sender...');
        const generalResponse2 = await axios.get(`${API_BASE_URL}/notification/general`, {
          headers: {
            'Authorization': `Bearer test-token`,
            'x-access-key': BUYER_API_KEY,
            'Content-Type': 'application/json'
          },
          withCredentials: true
        });
        
        if (generalResponse2.data.notifications && generalResponse2.data.notifications.length > 0) {
          const notification = generalResponse2.data.notifications[0];
          console.log('📋 Latest general notification details:');
          console.log('  - ID:', notification._id);
          console.log('  - Title:', notification.title);
          console.log('  - SenderId type:', typeof notification.senderId);
          console.log('  - SenderId value:', notification.senderId);
          console.log('  - SenderName:', notification.senderName);
          console.log('  - SenderEmail:', notification.senderEmail);
          
          if (typeof notification.senderId === 'object' && notification.senderId !== null) {
            console.log('✅ Sender data is populated!');
            console.log('  - Populated sender data:', notification.senderId);
          } else {
            console.log('❌ Sender data is not populated');
          }
        }
      } else {
        console.log('❌ No users found in database');
      }
    } catch (error) {
      console.error('❌ Error creating test notification:', error.response?.data || error.message);
    }
    
    console.log('\n✅ Test completed! Check the results above.');
    console.log('Expected results:');
    console.log('- SenderId should be populated with user object containing firstName, lastName, email');
    console.log('- SenderName should be automatically generated from populated user data');
    console.log('- SenderEmail should be automatically generated from populated user data');
    
  } catch (error) {
    console.error('❌ Error in test:', error.response?.data || error.message);
  }
}

// Run the test
testSenderPopulation();
