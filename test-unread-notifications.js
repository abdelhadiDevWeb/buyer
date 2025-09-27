// Test script to create unread notifications and verify the system
const axios = require('axios');

const API_BASE_URL = 'http://localhost:3000';
const BUYER_API_KEY = process.env.NEXT_PUBLIC_KEY_API_BYUER || 'your-api-key-here';

async function createUnreadNotifications() {
  try {
    console.log('🧪 Creating unread notifications for testing...');
    
    // Create unread general notification (should appear in bell icon)
    const generalNotification = await axios.post(`${API_BASE_URL}/notification`, {
      userId: 'test-user-id',
      type: 'BID_CREATED',
      title: 'New Auction Available',
      message: 'A new auction has been created for testing - this should appear in bell icon',
      data: { test: true, auctionId: 'test-auction-123' },
      read: false // Explicitly set as unread
    }, {
      headers: {
        'x-access-key': BUYER_API_KEY,
        'Content-Type': 'application/json'
      }
    });
    console.log('✅ Unread general notification created:', generalNotification.data);
    
    // Create unread chat notification (should appear in messages icon)
    const chatNotification = await axios.post(`${API_BASE_URL}/notification`, {
      userId: 'test-user-id',
      type: 'CHAT_CREATED',
      title: 'Nouveau chat avec le gagnant',
      message: 'Un nouveau chat a été créé - this should appear in messages icon',
      data: { 
        test: true, 
        chatId: 'test-chat-123',
        winnerName: 'Test Buyer',
        productTitle: 'Test Product'
      },
      read: false // Explicitly set as unread
    }, {
      headers: {
        'x-access-key': BUYER_API_KEY,
        'Content-Type': 'application/json'
      }
    });
    console.log('✅ Unread chat notification created:', chatNotification.data);
    
    // Create unread message notification (should appear in messages icon)
    const messageNotification = await axios.post(`${API_BASE_URL}/notification`, {
      userId: 'test-user-id',
      type: 'MESSAGE_RECEIVED',
      title: 'Nouveau message reçu',
      message: 'Vous avez reçu un nouveau message - this should appear in messages icon',
      data: { 
        test: true, 
        chatId: 'test-chat-123',
        senderName: 'Test Seller',
        message: 'Hello, how are you?'
      },
      read: false // Explicitly set as unread
    }, {
      headers: {
        'x-access-key': BUYER_API_KEY,
        'Content-Type': 'application/json'
      }
    });
    console.log('✅ Unread message notification created:', messageNotification.data);
    
    // Create a read notification (should NOT appear in any icon)
    const readNotification = await axios.post(`${API_BASE_URL}/notification`, {
      userId: 'test-user-id',
      type: 'BID_ENDED',
      title: 'Auction Ended',
      message: 'This auction has ended - this should NOT appear anywhere',
      data: { test: true, auctionId: 'test-auction-456' },
      read: true // Explicitly set as read
    }, {
      headers: {
        'x-access-key': BUYER_API_KEY,
        'Content-Type': 'application/json'
      }
    });
    console.log('✅ Read notification created (should not appear):', readNotification.data);
    
    // Check all notifications
    console.log('\n📊 Checking all notifications...');
    const allNotifications = await axios.get(`${API_BASE_URL}/notification/debug/all`, {
      headers: {
        'x-access-key': BUYER_API_KEY
      }
    });
    
    console.log('📋 Total notifications in database:', allNotifications.data.total);
    
    const unreadNotifications = allNotifications.data.notifications.filter(n => n.read === false);
    const readNotifications = allNotifications.data.notifications.filter(n => n.read === true);
    
    console.log('📋 Unread notifications:', unreadNotifications.length);
    console.log('📋 Read notifications:', readNotifications.length);
    
    console.log('\n📋 Unread notifications details:');
    unreadNotifications.forEach(n => {
      console.log(`  - ${n.title} (${n.type}) - read: ${n.read}`);
    });
    
    console.log('\n📋 Read notifications details:');
    readNotifications.forEach(n => {
      console.log(`  - ${n.title} (${n.type}) - read: ${n.read}`);
    });
    
    // Test the filtering logic
    console.log('\n🔍 Testing notification filtering...');
    
    // Test general notifications filtering
    const generalNotifications = allNotifications.data.notifications.filter(n => {
      if (n.read === true) return false; // Only unread
      
      const isChatNotification = 
        n.type === 'CHAT_CREATED' || 
        n.type === 'MESSAGE_RECEIVED' ||
        n.type === 'MESSAGE_ADMIN';
      
      const isAdminMessageTitle = n.title === 'Nouveau message de l\'admin';
      const isAdminSender = 
        n.data?.senderId === 'admin' ||
        (n.data?.sender as any)?._id === 'admin';
      
      return !isChatNotification && !isAdminMessageTitle && !isAdminSender;
    });
    
    console.log('🔔 General notifications (should appear in bell):', generalNotifications.length);
    generalNotifications.forEach(n => {
      console.log(`  - ${n.title} (${n.type}) - read: ${n.read}`);
    });
    
    // Test chat notifications filtering
    const chatNotifications = allNotifications.data.notifications.filter(n => {
      if (n.read === true) return false; // Only unread
      
      const isCorrectType = n.type === 'CHAT_CREATED' || n.type === 'MESSAGE_RECEIVED';
      
      const isAdminSender =
        (n.data?.users as any)?.[0]?._id === 'admin' ||
        (n.data?.users as any)?.[0]?.AccountType === 'admin' ||
        n.data?.senderId === 'admin' ||
        (n.data?.sender as any)?._id === 'admin' ||
        (n.data?.sender as any)?.AccountType === 'admin';
      
      const isAdminMessageTitle = n.title === 'Nouveau message de l\'admin';
      
      return isCorrectType && !isAdminSender && !isAdminMessageTitle;
    });
    
    console.log('💬 Chat notifications (should appear in messages):', chatNotifications.length);
    chatNotifications.forEach(n => {
      console.log(`  - ${n.title} (${n.type}) - read: ${n.read}`);
    });
    
    console.log('\n✅ Test completed! Check the frontend to see if notifications appear correctly.');
    console.log('Expected results:');
    console.log('- Bell icon should show 1 notification (BID_CREATED)');
    console.log('- Messages icon should show 2 notifications (CHAT_CREATED, MESSAGE_RECEIVED)');
    console.log('- Read notification should not appear anywhere');
    
  } catch (error) {
    console.error('❌ Error creating test notifications:', error.response?.data || error.message);
  }
}

// Run the test
createUnreadNotifications();
