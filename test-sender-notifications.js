// Test script to create notifications with sender information
const axios = require('axios');

const API_BASE_URL = 'http://localhost:3000';
const BUYER_API_KEY = process.env.NEXT_PUBLIC_KEY_API_BYUER || 'your-api-key-here';

async function createNotificationsWithSenderInfo() {
  try {
    console.log('🧪 Creating notifications with sender information...');
    
    // Create a general notification with sender info (should appear in bell icon)
    const generalNotification = await axios.post(`${API_BASE_URL}/notification`, {
      userId: 'test-user-id',
      type: 'BID_CREATED',
      title: 'Nouvelle Enchère Disponible',
      message: 'Une nouvelle enchère a été créée par John Doe dans la catégorie Électronique',
      data: { 
        test: true, 
        auctionId: 'test-auction-123',
        categoryName: 'Électronique',
        productTitle: 'iPhone 15 Pro'
      },
      read: false,
      senderId: 'seller-123',
      senderName: 'John Doe',
      senderEmail: 'john.doe@example.com'
    }, {
      headers: {
        'x-access-key': BUYER_API_KEY,
        'Content-Type': 'application/json'
      }
    });
    console.log('✅ General notification with sender created:', generalNotification.data);
    
    // Create a chat notification with sender info (should appear in messages icon)
    const chatNotification = await axios.post(`${API_BASE_URL}/notification`, {
      userId: 'test-user-id',
      type: 'CHAT_CREATED',
      title: 'Nouveau chat créé',
      message: 'Un nouveau chat a été créé avec le vendeur Jane Smith pour finaliser votre achat',
      data: { 
        test: true, 
        chatId: 'test-chat-123',
        sellerName: 'Jane Smith',
        productTitle: 'MacBook Pro M3'
      },
      read: false,
      senderId: 'seller-456',
      senderName: 'Jane Smith',
      senderEmail: 'jane.smith@example.com'
    }, {
      headers: {
        'x-access-key': BUYER_API_KEY,
        'Content-Type': 'application/json'
      }
    });
    console.log('✅ Chat notification with sender created:', chatNotification.data);
    
    // Create a message notification with sender info (should appear in messages icon)
    const messageNotification = await axios.post(`${API_BASE_URL}/notification`, {
      userId: 'test-user-id',
      type: 'MESSAGE_RECEIVED',
      title: 'Nouveau message reçu',
      message: 'Vous avez reçu un nouveau message de Alice Johnson',
      data: { 
        test: true, 
        chatId: 'test-chat-456',
        senderName: 'Alice Johnson',
        message: 'Bonjour! Avez-vous des questions sur le produit?'
      },
      read: false,
      senderId: 'user-789',
      senderName: 'Alice Johnson',
      senderEmail: 'alice.johnson@example.com'
    }, {
      headers: {
        'x-access-key': BUYER_API_KEY,
        'Content-Type': 'application/json'
      }
    });
    console.log('✅ Message notification with sender created:', messageNotification.data);
    
    // Create a bid won notification with sender info (should appear in bell icon)
    const bidWonNotification = await axios.post(`${API_BASE_URL}/notification`, {
      userId: 'test-user-id',
      type: 'BID_WON',
      title: 'Félicitations! Vous avez gagné l\'enchère',
      message: 'Vous avez gagné l\'enchère pour "iPhone 15 Pro" avec une offre de 1200€',
      data: { 
        test: true, 
        auctionId: 'test-auction-789',
        productTitle: 'iPhone 15 Pro',
        finalPrice: 1200,
        sellerName: 'Tech Store'
      },
      read: false,
      senderId: 'system',
      senderName: 'Système',
      senderEmail: 'system@mazadclick.com'
    }, {
      headers: {
        'x-access-key': BUYER_API_KEY,
        'Content-Type': 'application/json'
      }
    });
    console.log('✅ Bid won notification with sender created:', bidWonNotification.data);
    
    // Check all notifications
    console.log('\n📊 Checking all notifications with sender information...');
    const allNotifications = await axios.get(`${API_BASE_URL}/notification/debug/all`, {
      headers: {
        'x-access-key': BUYER_API_KEY
      }
    });
    
    console.log('📋 Total notifications in database:', allNotifications.data.total);
    
    const unreadNotifications = allNotifications.data.notifications.filter(n => n.read === false);
    console.log('📋 Unread notifications:', unreadNotifications.length);
    
    console.log('\n📋 Unread notifications with sender details:');
    unreadNotifications.forEach(n => {
      console.log(`  - ${n.title} (${n.type})`);
      console.log(`    Sender: ${n.senderName || 'Unknown'} (${n.senderEmail || 'No email'})`);
      console.log(`    Read: ${n.read}`);
      console.log(`    Data sender: ${n.data?.senderName || n.data?.winnerName || n.data?.buyerName || 'None'}`);
      console.log('    ---');
    });
    
    // Test the filtering logic
    console.log('\n🔍 Testing notification filtering with sender info...');
    
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
      console.log(`  - ${n.title} (${n.type}) - Sender: ${n.senderName || 'Unknown'}`);
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
      console.log(`  - ${n.title} (${n.type}) - Sender: ${n.senderName || 'Unknown'}`);
    });
    
    console.log('\n✅ Test completed! Check the frontend to see if notifications show sender information correctly.');
    console.log('Expected results:');
    console.log('- Bell icon should show 2 notifications (BID_CREATED, BID_WON) with sender names');
    console.log('- Messages icon should show 2 notifications (CHAT_CREATED, MESSAGE_RECEIVED) with sender names');
    console.log('- Each notification should display sender information below the message');
    
  } catch (error) {
    console.error('❌ Error creating test notifications:', error.response?.data || error.message);
  }
}

// Run the test
createNotificationsWithSenderInfo();
