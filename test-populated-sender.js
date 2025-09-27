// Test script to verify sender information is properly populated from userId
const axios = require('axios');

const API_BASE_URL = 'http://localhost:3000';
const BUYER_API_KEY = process.env.NEXT_PUBLIC_KEY_API_BYUER || 'your-api-key-here';

async function testPopulatedSenderInfo() {
  try {
    console.log('🧪 Testing populated sender information...');
    
    // First, let's create a test user to be the sender
    const testUser = {
      firstName: 'John',
      lastName: 'Doe',
      email: 'john.doe@example.com',
      password: 'testpassword123'
    };
    
    console.log('👤 Creating test user for sender...');
    const userResponse = await axios.post(`${API_BASE_URL}/auth/register`, testUser, {
      headers: {
        'x-access-key': BUYER_API_KEY,
        'Content-Type': 'application/json'
      }
    });
    
    const senderId = userResponse.data.user._id;
    console.log('✅ Test user created with ID:', senderId);
    
    // Now create a notification with the senderId
    console.log('📝 Creating notification with senderId...');
    const notificationResponse = await axios.post(`${API_BASE_URL}/notification`, {
      userId: 'test-recipient-id',
      type: 'BID_CREATED',
      title: 'Nouvelle Enchère Disponible',
      message: 'Une nouvelle enchère a été créée par John Doe',
      data: { 
        test: true, 
        auctionId: 'test-auction-123',
        productTitle: 'iPhone 15 Pro'
      },
      read: false,
      senderId: senderId // This should be populated from the User collection
    }, {
      headers: {
        'x-access-key': BUYER_API_KEY,
        'Content-Type': 'application/json'
      }
    });
    
    console.log('✅ Notification created:', notificationResponse.data);
    
    // Now test the new endpoints
    console.log('\n🔍 Testing general notifications endpoint...');
    const generalResponse = await axios.get(`${API_BASE_URL}/notification/general`, {
      headers: {
        'Authorization': `Bearer test-token`,
        'x-access-key': BUYER_API_KEY,
        'Content-Type': 'application/json'
      },
      withCredentials: true
    });
    
    console.log('📊 General notifications response:', generalResponse.data);
    
    if (generalResponse.data.notifications && generalResponse.data.notifications.length > 0) {
      const notification = generalResponse.data.notifications[0];
      console.log('📋 First notification details:');
      console.log('  - ID:', notification._id);
      console.log('  - Title:', notification.title);
      console.log('  - Sender ID:', notification.senderId);
      console.log('  - Sender Name:', notification.senderName);
      console.log('  - Sender Email:', notification.senderEmail);
      console.log('  - Is senderId populated?', typeof notification.senderId === 'object');
      
      if (typeof notification.senderId === 'object') {
        console.log('  - Populated sender data:', notification.senderId);
      }
    }
    
    console.log('\n🔍 Testing chat notifications endpoint...');
    const chatResponse = await axios.get(`${API_BASE_URL}/notification/chat`, {
      headers: {
        'Authorization': `Bearer test-token`,
        'x-access-key': BUYER_API_KEY,
        'Content-Type': 'application/json'
      },
      withCredentials: true
    });
    
    console.log('📊 Chat notifications response:', chatResponse.data);
    
    // Test creating a chat notification with senderId
    console.log('\n💬 Creating chat notification with senderId...');
    const chatNotificationResponse = await axios.post(`${API_BASE_URL}/notification`, {
      userId: 'test-recipient-id',
      type: 'CHAT_CREATED',
      title: 'Nouveau chat créé',
      message: 'Un nouveau chat a été créé avec John Doe',
      data: { 
        test: true, 
        chatId: 'test-chat-123',
        sellerName: 'John Doe',
        productTitle: 'MacBook Pro M3'
      },
      read: false,
      senderId: senderId
    }, {
      headers: {
        'x-access-key': BUYER_API_KEY,
        'Content-Type': 'application/json'
      }
    });
    
    console.log('✅ Chat notification created:', chatNotificationResponse.data);
    
    // Test the chat endpoint again
    console.log('\n🔍 Testing chat notifications endpoint after creating chat notification...');
    const chatResponse2 = await axios.get(`${API_BASE_URL}/notification/chat`, {
      headers: {
        'Authorization': `Bearer test-token`,
        'x-access-key': BUYER_API_KEY,
        'Content-Type': 'application/json'
      },
      withCredentials: true
    });
    
    console.log('📊 Chat notifications response (after creation):', chatResponse2.data);
    
    if (chatResponse2.data.notifications && chatResponse2.data.notifications.length > 0) {
      const notification = chatResponse2.data.notifications[0];
      console.log('📋 First chat notification details:');
      console.log('  - ID:', notification._id);
      console.log('  - Title:', notification.title);
      console.log('  - Sender ID:', notification.senderId);
      console.log('  - Sender Name:', notification.senderName);
      console.log('  - Sender Email:', notification.senderEmail);
      console.log('  - Is senderId populated?', typeof notification.senderId === 'object');
      
      if (typeof notification.senderId === 'object') {
        console.log('  - Populated sender data:', notification.senderId);
      }
    }
    
    console.log('\n✅ Test completed! Check the results above to verify sender information is properly populated.');
    console.log('Expected results:');
    console.log('- senderId should be populated with user object containing firstName, lastName, email');
    console.log('- senderName should be automatically generated from populated user data');
    console.log('- senderEmail should be automatically generated from populated user data');
    
  } catch (error) {
    console.error('❌ Error testing populated sender info:', error.response?.data || error.message);
  }
}

// Run the test
testPopulatedSenderInfo();
