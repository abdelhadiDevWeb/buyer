// Test script to create notifications and check the system
const axios = require('axios');

const API_BASE_URL = 'http://localhost:3000';
const BUYER_API_KEY = process.env.NEXT_PUBLIC_KEY_API_BYUER || 'your-api-key-here';

async function createTestNotifications() {
  try {
    console.log('🧪 Creating test notifications...');
    
    // Create a general notification (should appear in bell icon)
    const generalNotification = await axios.post(`${API_BASE_URL}/notification`, {
      userId: 'test-user-id',
      type: 'BID_CREATED',
      title: 'Test Auction Notification',
      message: 'A new auction has been created for testing',
      data: { test: true, auctionId: 'test-auction-123' }
    }, {
      headers: {
        'x-access-key': BUYER_API_KEY,
        'Content-Type': 'application/json'
      }
    });
    console.log('✅ General notification created:', generalNotification.data);
    
    // Create a chat notification (should appear in messages icon)
    const chatNotification = await axios.post(`${API_BASE_URL}/notification`, {
      userId: 'test-user-id',
      type: 'CHAT_CREATED',
      title: 'Nouveau chat avec le gagnant',
      message: 'Un nouveau chat a été créé avec l\'acheteur Test Buyer pour finaliser la vente.',
      data: { 
        test: true, 
        chatId: 'test-chat-123',
        winnerName: 'Test Buyer',
        productTitle: 'Test Product'
      }
    }, {
      headers: {
        'x-access-key': BUYER_API_KEY,
        'Content-Type': 'application/json'
      }
    });
    console.log('✅ Chat notification created:', chatNotification.data);
    
    // Create a message notification (should appear in messages icon)
    const messageNotification = await axios.post(`${API_BASE_URL}/notification`, {
      userId: 'test-user-id',
      type: 'MESSAGE_RECEIVED',
      title: 'Nouveau message reçu',
      message: 'Vous avez reçu un nouveau message dans le chat.',
      data: { 
        test: true, 
        chatId: 'test-chat-123',
        senderName: 'Test Seller',
        message: 'Hello, how are you?'
      }
    }, {
      headers: {
        'x-access-key': BUYER_API_KEY,
        'Content-Type': 'application/json'
      }
    });
    console.log('✅ Message notification created:', messageNotification.data);
    
    // Check all notifications
    console.log('\n📊 Checking all notifications...');
    const allNotifications = await axios.get(`${API_BASE_URL}/notification/debug/all`, {
      headers: {
        'x-access-key': BUYER_API_KEY
      }
    });
    
    console.log('📋 Total notifications in database:', allNotifications.data.total);
    console.log('📋 All notifications:', allNotifications.data.notifications.map(n => ({
      id: n.id,
      title: n.title,
      type: n.type,
      read: n.read,
      userId: n.userId
    })));
    
    // Test the new API endpoints
    console.log('\n🔍 Testing new API endpoints...');
    
    // Test general notifications endpoint
    try {
      const generalResponse = await axios.get(`${API_BASE_URL}/notification/all`, {
        headers: {
          'x-access-key': BUYER_API_KEY
        }
      });
      
      const generalNotifications = generalResponse.data.filter(n => 
        n.type !== 'CHAT_CREATED' && 
        n.type !== 'MESSAGE_RECEIVED' && 
        n.type !== 'MESSAGE_ADMIN' &&
        n.title !== 'Nouveau message de l\'admin'
      );
      
      console.log('🔔 General notifications (filtered):', generalNotifications.length);
      console.log('🔔 General notification types:', generalNotifications.map(n => n.type));
    } catch (error) {
      console.error('❌ Error testing general notifications:', error.message);
    }
    
    // Test chat notifications filtering
    try {
      const chatNotifications = allNotifications.data.notifications.filter(n => 
        (n.type === 'CHAT_CREATED' || n.type === 'MESSAGE_RECEIVED') &&
        n.title !== 'Nouveau message de l\'admin'
      );
      
      console.log('💬 Chat notifications (filtered):', chatNotifications.length);
      console.log('💬 Chat notification types:', chatNotifications.map(n => n.type));
    } catch (error) {
      console.error('❌ Error testing chat notifications:', error.message);
    }
    
  } catch (error) {
    console.error('❌ Error creating test notifications:', error.response?.data || error.message);
  }
}

// Run the test
createTestNotifications();
