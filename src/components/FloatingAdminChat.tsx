import React, { useState, useEffect, useRef } from 'react';
import './FloatingAdminChat.css';
import { useTranslation } from 'react-i18next';
import { useCreateSocket } from '../contexts/socket';
import { ChatAPI } from '../app/api/chat';
import { MessageAPI } from '../app/api/messages';
import { UserAPI } from '../app/api/users';
import useAuth from '../hooks/useAuth';
import { useAdminMessageNotifications } from '../hooks/useAdminMessageNotifications';

interface Message {
    _id: string;
    message: string;
    sender: string;
    reciver: string;
    idChat: string;
    createdAt: string;
    isError?: boolean;
    isTemp?: boolean;
}

interface AdminChat {
    _id: string;
    users: Array<{
        _id: string;
        firstName: string;
        lastName: string;
        AccountType: string;
    }>;
    createdAt: string;
}

const FloatingAdminChat: React.FC = () => {
    const { t } = useTranslation();
    const { auth } = useAuth();
    const socketContext = useCreateSocket();

    // Check if we're on auth-related pages and disable chat entirely
    const isOnAuthPage = typeof window !== 'undefined' && (
        window.location.pathname.includes('/login') ||
        window.location.pathname.includes('/register') ||
        window.location.pathname.includes('/otp-verification') ||
        window.location.pathname.includes('/reset-password') ||
        window.location.pathname.includes('/identity-verification') ||
        window.location.pathname.includes('/subscription-plans')
    );

    // Use the new admin message notifications hook
    const { unreadAdminMessagesCount, adminNotifications, refreshNotifications, clearSocketMessages } = useAdminMessageNotifications();

    const [isOpen, setIsOpen] = useState(false);
    const [message, setMessage] = useState('');
    const [messages, setMessages] = useState<Message[]>([]);
    const [adminChat, setAdminChat] = useState<AdminChat | null>(null);
    const [isTyping, setIsTyping] = useState(false);
    const [unreadCount, setUnreadCount] = useState(0);
    const [isLoading, setIsLoading] = useState(false);
    const [isSending, setIsSending] = useState(false);
    const [showEmojiPicker, setShowEmojiPicker] = useState(false);
    const [showCharCount, setShowCharCount] = useState(false);

    const messagesEndRef = useRef<HTMLDivElement>(null);
    const typingTimeoutRef = useRef<NodeJS.Timeout | undefined>(undefined);
    const textareaRef = useRef<HTMLTextAreaElement>(null);

    // Dynamic scroll to bottom with better implementation
    const scrollToBottom = () => {
        const messagesContainer = document.querySelector('.messages-area');
        if (messagesContainer) {
            messagesContainer.scrollTop = messagesContainer.scrollHeight;
        }
    };

    // Force scroll to bottom (for immediate response)
    const forceScrollToBottom = () => {
        const messagesContainer = document.querySelector('.messages-area');
        if (messagesContainer) {
            messagesContainer.scrollTo({
                top: messagesContainer.scrollHeight,
                behavior: 'smooth'
            });
        }
    };

    // Enhanced auto-scroll that triggers on any message change
    useEffect(() => {
        // Always scroll to bottom when messages change (send/receive)
        if (messages.length > 0) {
            // Immediate scroll for better responsiveness
            scrollToBottom();
            
            // Additional smooth scroll after rendering
            setTimeout(() => {
                forceScrollToBottom();
            }, 100);
        }
    }, [messages]);

    // Additional scroll trigger when chat opens
    useEffect(() => {
        if (isOpen && messages.length > 0) {
            // Immediate scroll when chat opens
            setTimeout(() => {
                scrollToBottom();
            }, 100);
            
            // Smooth scroll after full rendering
            setTimeout(() => {
                forceScrollToBottom();
            }, 300);
        }
    }, [isOpen, messages.length]);

    // Auto-resize textarea
    const adjustTextareaHeight = () => {
        const textarea = textareaRef.current;
        if (textarea) {
            textarea.style.height = 'auto';
            const newHeight = Math.min(textarea.scrollHeight, 100); // Max height of 100px
            textarea.style.height = newHeight + 'px';
        }
    };

    useEffect(() => {
        adjustTextareaHeight();
    }, [message]);

    // Close emoji picker when clicking outside
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (showEmojiPicker && !((event.target as Element)?.closest('.emoji-picker') || (event.target as Element)?.closest('.emoji-btn'))) {
                setShowEmojiPicker(false);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, [showEmojiPicker]);

    // Initialize admin chat - FIXED VERSION
    const initializeAdminChat = async () => {
        if (!auth?.user?._id || !auth?.tokens?.accessToken) {
            console.log('FloatingAdminChat: User not authenticated, skipping chat initialization');
            return;
        }

        if (isOnAuthPage) {
            console.log('FloatingAdminChat: On auth page, completely skipping chat initialization');
            return;
        }

        console.log('FloatingAdminChat: Initializing admin chat for user:', auth.user._id);
        setIsLoading(true);

        try {
            // Get existing chats for this user
            const existingChatsResponse = await ChatAPI.getChats({
                id: auth.user._id,
                from: 'seller'
            });

            console.log('FloatingAdminChat: Existing chats response:', existingChatsResponse);

            // Handle API response structure
            const existingChats = existingChatsResponse?.success ? existingChatsResponse.data : [];
            
            // Find admin chat (chat with admin user)
            const adminChatExists = existingChats?.find((chat: any) =>
                chat.users?.some((user: any) => user.AccountType === 'admin' || user._id === 'admin')
            );

            if (adminChatExists) {
                console.log('FloatingAdminChat: Found existing admin chat:', adminChatExists);
                setAdminChat(adminChatExists as AdminChat);

                // Load messages for this chat
                const chatMessagesResponse = await MessageAPI.getByConversation(adminChatExists._id || '');
                const chatMessages = chatMessagesResponse?.success ? chatMessagesResponse.data : [];
                setMessages(chatMessages as Message[]);
                console.log('FloatingAdminChat: Loaded messages:', chatMessages);
            } else {
                console.log('FloatingAdminChat: No admin chat found, will create on first message');
            }
        } catch (error) {
            console.error('FloatingAdminChat: Error initializing admin chat:', error);
        } finally {
            setIsLoading(false);
        }
    };

    // Create admin chat if it doesn't exist - FIXED VERSION
    const createAdminChat = async () => {
        if (!auth?.user?._id || !auth?.tokens?.accessToken) {
            console.log('FloatingAdminChat: User not authenticated, cannot create chat');
            return null;
        }

        if (isOnAuthPage) {
            console.log('FloatingAdminChat: On auth page, cannot create chat');
            return null;
        }

        try {
            console.log('FloatingAdminChat: Creating new admin chat');

            // Get admin users from API
            let admins: any[] = [];
            try {
                const adminsResponse = await UserAPI.getAdmins();
                admins = adminsResponse?.success ? adminsResponse.data || [] : [];
                console.log('FloatingAdminChat: Found admins:', admins);
            } catch (apiError) {
                console.error('FloatingAdminChat: Could not fetch admin users:', apiError);
                // Fallback: create a default admin structure
                admins = [{
                    _id: 'admin',
                    firstName: 'Admin',
                    lastName: 'Support',
                    AccountType: 'admin',
                    phone: ''
                }];
            }

            if (!admins || admins.length === 0) {
                console.log('FloatingAdminChat: No admin users found, using fallback admin');
                // Use fallback admin instead of returning null
                admins = [{
                    _id: 'admin',
                    firstName: 'Admin',
                    lastName: 'Support',
                    AccountType: 'admin',
                    phone: ''
                }];
            }

            // Use the first admin user
            const adminUser = admins[0];
            console.log('FloatingAdminChat: Using admin user:', adminUser);

            const chatData = {
                users: [
                    {
                        _id: auth.user._id,
                        firstName: auth.user.firstName,
                        lastName: auth.user.lastName,
                        AccountType: auth.user.type || 'seller',
                        phone: auth.user.phone || ''
                    },
                    {
                        _id: adminUser._id,
                        firstName: adminUser.firstName || 'Admin',
                        lastName: adminUser.lastName || 'Support',
                        AccountType: 'admin',
                        phone: adminUser.phone || ''
                    }
                ],
                createdAt: new Date().toISOString()
            };

            console.log('FloatingAdminChat: Creating chat with data:', chatData);
            const newChatResponse = await ChatAPI.createChat(chatData);
            console.log('FloatingAdminChat: Chat created successfully:', newChatResponse);
            
            // Extract data from API response
            let newChat = newChatResponse?.success ? newChatResponse.data : newChatResponse;
            console.log('FloatingAdminChat: Extracted chat data:', newChat);

            // If the API call failed or returned invalid data, create a fallback chat object
            if (!newChat || !(newChat as any)._id) {
                console.log('FloatingAdminChat: API returned invalid chat data, creating fallback chat');
                newChat = {
                    _id: `fallback-chat-${Date.now()}`,
                    users: chatData.users,
                    createdAt: chatData.createdAt
                };
            }

            console.log('FloatingAdminChat: Final chat object:', newChat);
            setAdminChat(newChat as AdminChat);
            return newChat as AdminChat;
        } catch (error) {
            console.error('FloatingAdminChat: Error creating admin chat:', error);
            return null;
        }
    };

    // Send message - IMPROVED VERSION with immediate local display
    const sendMessage = async () => {
        if (!message.trim() || !auth?.user?._id || !auth?.tokens?.accessToken || isSending) {
            if (!auth?.tokens?.accessToken) {
                console.log('FloatingAdminChat: User not authenticated, cannot send message');
            }
            return;
        }

        console.log('📤 Sending message:', message.trim());
        console.log('📤 Current user:', auth.user._id);
        console.log('📤 Current chat:', adminChat);

        setIsSending(true);
        let currentChat = adminChat;

        // Create chat if it doesn't exist
        if (!currentChat) {
            console.log('📤 Creating new admin chat');
            currentChat = await createAdminChat();
            if (!currentChat) {
                console.error('❌ Failed to create admin chat');
                setIsSending(false);
                return;
            }
        }

        // Create a temporary message for immediate display
        const tempMessage = {
            _id: `temp-${Date.now()}-${Math.random()}`,
            message: message.trim(),
            sender: auth.user._id,
            reciver: 'admin',
            idChat: currentChat._id,
            createdAt: new Date().toISOString(),
            isTemp: true // Flag to identify temporary messages
        };

        // Add message to local state immediately for instant feedback
        setMessages(prev => [...prev, tempMessage]);
        console.log('✅ Message added to local state immediately');
        
        // Immediately scroll to bottom when user sends a message
        setTimeout(() => {
            scrollToBottom();
        }, 10);
        
        // Additional smooth scroll for better UX
        setTimeout(() => {
            forceScrollToBottom();
        }, 50);

        try {
            const messageData = {
                idChat: currentChat._id,
                message: message.trim(),
                sender: auth.user._id,
                reciver: 'admin', // This will be handled by backend to send to all admins
            };

            console.log('📤 Sending via API:', messageData);
            const sentMessage = await MessageAPI.send(messageData);
            console.log('✅ Message sent successfully:', sentMessage);

            setMessage('');

            // Replace temporary message with real message from server
            if (sentMessage && (sentMessage as any)._id) {
                setMessages(prev => prev.map(msg =>
                    (msg as any).isTemp && msg.message === messageData.message ?
                        { ...(sentMessage as any), createdAt: (sentMessage as any).createdAt || new Date().toISOString() } :
                        msg
                ));
                console.log('✅ Temporary message replaced with server message');
            } else {
                // Fallback: refresh all messages if no response
                const updatedMessagesResponse = await MessageAPI.getByConversation(currentChat._id);
                const updatedMessages = updatedMessagesResponse?.success ? updatedMessagesResponse.data : [];
                setMessages(updatedMessages as Message[]);
                console.log('✅ Messages refreshed from server');
            }
        } catch (error) {
            console.error('❌ Error sending message:', error);

            // Show error message to user
            const errorMessage = {
                _id: `error-${Date.now()}`,
                message: 'Failed to send message. Please try again.',
                sender: 'system',
                reciver: auth.user._id,
                idChat: currentChat._id,
                createdAt: new Date().toISOString(),
                isError: true
            };

            // Replace temporary message with error message
            setMessages(prev => prev.map(msg =>
                (msg as any).isTemp && msg.message === message.trim() ?
                    errorMessage : msg
            ));

            // Remove error message after 3 seconds
            setTimeout(() => {
                setMessages(prev => prev.filter(msg => !(msg as any).isError));
            }, 3000);

            console.log('❌ Error message displayed to user');
        } finally {
            setIsSending(false);
        }
    };

    // Real-time message listening for chat display - IMPROVED with better deduplication
    useEffect(() => {
        if (!socketContext?.socket || !adminChat?._id) {
            console.log('❌ Socket or chat not available in FloatingAdminChat');
            return;
        }

        console.log('🔌 Setting up real-time message listeners for chat:', adminChat._id);

        // Global cache to prevent duplicate processing across events
        const processedMessages = new Set<string>();

        // Unified message handler to prevent duplicates
        const handleIncomingMessage = (data: any, eventType: string) => {
            console.log(`📨 ${eventType} message received in FloatingAdminChat:`, data);

            // Create unique key for this message
            const messageKey = `${data._id || data.id || 'unknown'}-${data.message}-${data.sender}-${data.createdAt}`;

            // Check if already processed
            if (processedMessages.has(messageKey)) {
                console.log(`🚫 ${eventType} message already processed, skipping:`, messageKey);
                return;
            }

            // Mark as processed immediately
            processedMessages.add(messageKey);

            // Check if this message belongs to the current admin chat
            const isForCurrentChat = data.idChat === adminChat._id || data.chatId === adminChat._id;
            const isFromAdmin = data.sender === 'admin' || data.senderId === 'admin';
            const isForCurrentUser = data.reciver === auth?.user?._id || data.receiverId === auth?.user?._id;

            // For adminMessage events, we only want admin messages for the current user
            if (isForCurrentChat && isFromAdmin && isForCurrentUser) {
                console.log(`✅ Processing ${eventType} message for chat display`);

                setMessages(prev => {
                    // Check if message already exists in state
                    const exists = prev.some(msg =>
                        msg._id === data._id ||
                        (msg.message === data.message && msg.sender === data.sender &&
                            Math.abs(new Date(msg.createdAt).getTime() - new Date(data.createdAt).getTime()) < 1000)
                    );

                    if (exists) {
                        console.log(`🚫 ${eventType} message already exists in state, skipping`);
                        return prev;
                    }

                    // If this is a user's own message, replace any temporary version
                    if (data.sender === auth?.user?._id) {
                        const filtered = prev.filter(msg => !(msg as any).isTemp || msg.message !== data.message);
                        console.log(`✅ User message updated in chat (replaced temp) from ${eventType}`);
                        return [...filtered, data];
                    } else {
                        console.log(`✅ ${eventType} message added to chat`);
                        return [...prev, data];
                    }
                });
                
                // Scroll to bottom when receiving a new message
                setTimeout(() => {
                    scrollToBottom();
                }, 50);
                
                // Additional smooth scroll for better UX
                setTimeout(() => {
                    forceScrollToBottom();
                }, 150);
            } else {
                console.log(`🚫 ${eventType} message not for current chat/user, skipping`);
            }
        };

        // Listen for admin messages specifically - ONLY adminMessage event to prevent duplicates
        const handleAdminMessage = (data: any) => handleIncomingMessage(data, 'adminMessage');

        // Set up event listeners - ONLY adminMessage to prevent duplicates
        socketContext.socket.on('adminMessage', handleAdminMessage);

        return () => {
            console.log('🔌 Cleaning up real-time message listeners');
            socketContext.socket?.off('adminMessage', handleAdminMessage);
        };
    }, [socketContext?.socket, adminChat?._id, auth?.user?._id]); // Removed 'messages' dependency

    // Initialize chat when component mounts
    useEffect(() => {
        if (isOnAuthPage) {
            return; // Silent return on auth pages
        }

        if (auth?.user && auth?.tokens?.accessToken) {
            // Add delay to ensure authentication is fully complete before making API calls
            const timeoutId = setTimeout(() => {
                if (!isOnAuthPage && auth?.user && auth?.tokens?.accessToken) {
                    console.log('FloatingAdminChat: Initializing chat for user:', auth.user._id);
                    initializeAdminChat();
                    refreshNotifications();
                }
            }, 2000);

            return () => clearTimeout(timeoutId);
        }
    }, [auth?.user?._id, auth?.tokens?.accessToken]);

    // Update unread count from admin notifications
    useEffect(() => {
        setUnreadCount(unreadAdminMessagesCount);
    }, [unreadAdminMessagesCount]);

    // Reset unread count when opening chat
    useEffect(() => {
        if (isOpen) {
            console.log('🔔 Chat opened, clearing notifications');
            setUnreadCount(0);
            clearSocketMessages(); // Clear unread messages and new notifications when chat is opened

            // Also refresh notifications to mark them as read in database
            setTimeout(() => {
                refreshNotifications();
            }, 1000);
        }
    }, [isOpen, clearSocketMessages, refreshNotifications]);

    // Debug: Log messages state changes
    useEffect(() => {
        console.log('📝 Messages state changed:', messages);
        console.log('📝 Number of messages:', messages.length);
    }, [messages]);

    const handleKeyPress = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            sendMessage();
        }
    };

    const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
        const value = e.target.value;
        if (value.length <= 2000) { // Max character limit
            setMessage(value);
        }

        // Show character count when approaching limit
        setShowCharCount(value.length > 1800);

        // Clear typing timeout if it exists
        if (typingTimeoutRef.current) {
            clearTimeout(typingTimeoutRef.current);
        }

        // Set new typing timeout
        typingTimeoutRef.current = setTimeout(() => {
            // Handle typing indicator logic here if needed
        }, 1000);
    };

    // Add emoji to message
    const addEmoji = (emoji: string) => {
        setMessage(prev => prev + emoji);
        setShowEmojiPicker(false);
    };

    // Common emojis for quick access
    const quickEmojis = ['😊', '😂', '❤️', '👍', '🎉', '🔥', '✨', '🙏'];

    const formatTime = (dateString: string) => {
        const date = new Date(dateString);
        return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    };

    const isOwnMessage = (senderId: string) => senderId === auth?.user?._id;

    // Don't render the component at all on auth pages
    if (isOnAuthPage) {
        console.log('FloatingAdminChat: On auth page, not rendering component');
        return null;
    }

    return (
        <>
            {/* Floating Action Button */}
            <div className={`floating-chat-button ${isOpen ? 'hidden' : ''}`}>
                <button
                    className="chat-fab"
                    onClick={async () => {
                        if (!auth?.user?._id || !auth?.tokens?.accessToken) {
                            console.log('FloatingAdminChat: User not authenticated, cannot open chat');
                            return;
                        }

                        if (isOnAuthPage) {
                            console.log('FloatingAdminChat: On auth page, cannot open chat');
                            return;
                        }

                        // Show chat dialog immediately for better UX
                        setIsOpen(true);
                        setIsLoading(true);

                        try {
                            console.log('🔍 Starting chat initialization for user:', auth.user._id);
                            
                            // 1. Get all chats for this user
                            const existingChats = await ChatAPI.getChats({
                                id: auth.user._id,
                                from: 'seller'
                            });
                            
                            console.log('🔍 Existing chats response:', existingChats);

                            // 2. Check if a chat with admin exists
                            const existingChatsData = existingChats?.success ? existingChats.data : existingChats;
                            console.log('🔍 Existing chats data:', existingChatsData);
                            
                            let adminChatExists = null;
                            if (existingChatsData && Array.isArray(existingChatsData) && existingChatsData.length > 0) {
                                adminChatExists = existingChatsData.find((chat: any) =>
                                    chat.users?.some((user: any) => user.AccountType === 'admin' || user._id === 'admin') &&
                                    chat.users?.some((user: any) => user._id === auth.user?._id)
                                );
                            }
                            
                            console.log('🔍 Admin chat exists:', adminChatExists);

                            if (adminChatExists) {
                                console.log('FloatingAdminChat: Found existing admin chat:', adminChatExists);
                                setAdminChat(adminChatExists as AdminChat);

                                // Load messages with better error handling and logging
                                try {
                                    console.log('📥 Loading messages for chat:', adminChatExists._id);
                                    
                                    // Try to load messages with retry mechanism
                                    let chatMessages: Message[] = [];
                                    let retryCount = 0;
                                    const maxRetries = 3;
                                    
                                    while (retryCount < maxRetries) {
                                        try {
                                            if (!adminChatExists._id) {
                                                console.log('📥 No chat ID available, skipping message load');
                                                console.log('adminChatExists', adminChatExists);
                                                break;
                                            }
                                            console.log(`📥 Attempt ${retryCount + 1} to load messages`);
                                            const chatMessagesResponse = await MessageAPI.getByConversation(adminChatExists._id);
                                            console.log('📥 Messages response:', chatMessagesResponse);
                                            
                                            if (chatMessagesResponse?.success && chatMessagesResponse.data) {
                                                chatMessages = chatMessagesResponse.data as Message[];
                                                break; // Success, exit retry loop
                                            } else if (Array.isArray(chatMessagesResponse)) {
                                                chatMessages = chatMessagesResponse as Message[];
                                                break; // Success, exit retry loop
                                            } else {
                                                console.log('📥 Invalid response format, retrying...');
                                                retryCount++;
                                                if (retryCount < maxRetries) {
                                                    await new Promise(resolve => setTimeout(resolve, 1000)); // Wait 1 second before retry
                                                }
                                            }
                                        } catch (retryError) {
                                            console.error(`📥 Retry ${retryCount + 1} failed:`, retryError);
                                            retryCount++;
                                            if (retryCount < maxRetries) {
                                                await new Promise(resolve => setTimeout(resolve, 1000)); // Wait 1 second before retry
                                            }
                                        }
                                    }
                                    
                                    console.log('📥 Final messages to set:', chatMessages);
                                    setMessages(chatMessages);
                                    
                                    // Mark all messages in this chat as read
                                    try {
                                        if (adminChatExists._id) {
                                            await MessageAPI.markAllAsRead(adminChatExists._id);
                                            console.log('✅ All admin messages marked as read for chat:', adminChatExists._id);
                                        }
                                        // Immediately reset local unread count for instant UI feedback
                                        setUnreadCount(0);
                                        // Refresh admin notifications to update unread count
                                        refreshNotifications();
                                    } catch (error) {
                                        console.error('❌ Error marking admin messages as read:', error);
                                    }
                                } catch (messageError) {
                                    console.error('❌ Error loading messages:', messageError);
                                    // Set empty messages array if loading fails
                                    setMessages([]);
                                }

                                return;
                            }

                            // 3. If not, create a new chat
                            console.log('FloatingAdminChat: Creating new admin chat');
                            const newChat = await createAdminChat();

                            if (newChat) {
                                console.log('✅ New admin chat created successfully:', newChat);
                                // Load messages with better error handling and retry mechanism
                                try {
                                    console.log('📥 Loading messages for new chat:', newChat._id);
                                    
                                    // Try to load messages with retry mechanism
                                    let chatMessages: Message[] = [];
                                    let retryCount = 0;
                                    const maxRetries = 3;
                                    
                                    while (retryCount < maxRetries) {
                                        try {
                                            console.log(`📥 Attempt ${retryCount + 1} to load messages for new chat`);
                                            const chatMessagesResponse = await MessageAPI.getByConversation(newChat._id);
                                            console.log('📥 New chat messages response:', chatMessagesResponse);
                                            
                                            if (chatMessagesResponse?.success && chatMessagesResponse.data) {
                                                chatMessages = chatMessagesResponse.data as Message[];
                                                break; // Success, exit retry loop
                                            } else if (Array.isArray(chatMessagesResponse)) {
                                                chatMessages = chatMessagesResponse as Message[];
                                                break; // Success, exit retry loop
                                            } else {
                                                console.log('📥 Invalid response format for new chat, retrying...');
                                                retryCount++;
                                                if (retryCount < maxRetries) {
                                                    await new Promise(resolve => setTimeout(resolve, 1000)); // Wait 1 second before retry
                                                }
                                            }
                                        } catch (retryError) {
                                            console.error(`📥 Retry ${retryCount + 1} failed for new chat:`, retryError);
                                            retryCount++;
                                            if (retryCount < maxRetries) {
                                                await new Promise(resolve => setTimeout(resolve, 1000)); // Wait 1 second before retry
                                            }
                                        }
                                    }
                                    
                                    console.log('📥 Final messages for new chat:', chatMessages);
                                    setMessages(chatMessages);

                                    // Mark all messages in this chat as read (in case there are any)
                                    try {
                                        await MessageAPI.markAllAsRead(newChat._id);
                                        console.log('✅ All admin messages marked as read for new chat:', newChat._id);
                                        // Immediately reset local unread count for instant UI feedback
                                        setUnreadCount(0);
                                        // Refresh admin notifications to update unread count
                                        refreshNotifications();
                                    } catch (error) {
                                        console.error('❌ Error marking admin messages as read in new chat:', error);
                                    }
                                } catch (messageError) {
                                    console.error('❌ Error loading messages for new chat:', messageError);
                                    // Set empty messages array if loading fails
                                    setMessages([]);
                                }
                            } else {
                                console.error('❌ Failed to create admin chat - newChat is null/undefined');
                                // Show error message to user
                                setMessages([{
                                    _id: 'error-' + Date.now(),
                                    message: 'Failed to create chat. Please try again.',
                                    sender: 'system',
                                    reciver: auth.user._id,
                                    idChat: 'error',
                                    createdAt: new Date().toISOString(),
                                    isError: true
                                }]);
                            }
                        } catch (error) {
                            console.error('Error handling Floating Admin Chat:', error);
                        } finally {
                            setIsLoading(false);
                        }
                    }}
                    aria-label={t('chat.openAdminChat')}
                >
                    <i className="bi bi-headset"></i>
                    {unreadCount > 0 && (
                        <span className="unread-badge">{unreadCount}</span>
                    )}
                </button>
            </div>

            {/* Chat Dialog */}
            {isOpen && (
                <div className="chat-dialog-overlay" onClick={(e) => {
                    if (e.target === e.currentTarget) setIsOpen(false);
                }}>
                    <div className="chat-dialog">
                        {/* Header */}
                        <div className="chat-header">
                            <div className="chat-header-content">
                                <div className="admin-avatar">
                                    <i className="bi bi-headset"></i>
                                </div>
                                <div className="chat-title">
                                    <h4>{t('chat.adminSupport')}</h4>
                                    <div className="online-status">
                                        <span className="online-dot"></span>
                                        <span>{t('chat.online')}</span>
                                    </div>
                                </div>
                            </div>

                            <button
                                className="close-chat-btn"
                                onClick={() => setIsOpen(false)}
                                aria-label={t('chat.closeChat')}
                            >
                                <i className="bi bi-x"></i>
                            </button>
                        </div>

                        {/* Messages Area */}
                        <div className="chat-content">
                            <div className="messages-area">
                                {isLoading ? (
                                    <div className="loading-messages">
                                        <div className="loading-spinner"></div>
                                        <p>{t('chat.loadingMessages')}</p>
                                    </div>
                                ) : messages.length === 0 ? (
                                    <div className="empty-chat">
                                        <i className="bi bi-chat-dots"></i>
                                        <p>{t('chat.startConversation')}</p>
                                        <small>{t('chat.hereToHelp')}</small>
                                    </div>
                                ) : (
                                    messages
                                        .filter((msg, index, self) => {
                                            // Remove duplicate messages based on _id or content + sender + timestamp
                                            const duplicateIndex = self.findIndex(m => 
                                                (m._id && msg._id && m._id === msg._id) ||
                                                (m.message === msg.message && 
                                                 m.sender === msg.sender && 
                                                 m.idChat === msg.idChat &&
                                                 Math.abs(new Date(m.createdAt).getTime() - new Date(msg.createdAt).getTime()) < 1000)
                                            );
                                            return duplicateIndex === index;
                                        })
                                        .map((msg, index) => {
                                            const isTemp = (msg as any).isTemp;
                                            const isError = (msg as any).isError;
                                            const isSystem = msg.sender === 'system';

                                            return (
                                                <div
                                                    key={`${msg._id || 'msg'}-${index}-${Date.parse(msg.createdAt) || index}`}
                                                    className={`message ${isOwnMessage(msg.sender) ? 'own' : 'other'} ${isTemp ? 'temp-message' : ''} ${isSystem ? 'system-message' : ''}`}
                                                >
                                                    <div
                                                        className="message-bubble"
                                                        data-error={isError ? "true" : "false"}
                                                    >
                                                        <p>{msg.message}</p>
                                                        <span className="message-time">
                                                            {isTemp ? (
                                                                <span className="sending-indicator">
                                                                    <i className="bi bi-clock"></i> Sending...
                                                                </span>
                                                            ) : isError ? (
                                                                <span className="error-indicator">
                                                                    <i className="bi bi-exclamation-triangle"></i> Error
                                                                </span>
                                                            ) : (
                                                                formatTime(msg.createdAt)
                                                            )}
                                                        </span>
                                                    </div>
                                                </div>
                                            );
                                        })
                                )}

                                {isTyping && (
                                    <div className="message other">
                                        <div className="message-bubble typing">
                                            <p><em>{t('chat.adminTyping')}</em></p>
                                        </div>
                                    </div>
                                )}

                                <div ref={messagesEndRef} />
                            </div>

                            {/* Enhanced Message Input - This is where you can add new messages */}
                            <div className="message-input-area">
                                <div className="input-container">
                                    <div className="input-wrapper">
                                        <textarea
                                            ref={textareaRef}
                                            value={message}
                                            onChange={handleInputChange}
                                            onKeyPress={handleKeyPress}
                                            placeholder={t('chat.typeMessage')}
                                            className="message-input"
                                            disabled={isSending}
                                            style={{ 
                                                minHeight: '40px',
                                                resize: 'none',
                                                outline: 'none',
                                                border: 'none',
                                                background: 'transparent',
                                                fontFamily: 'inherit',
                                                fontSize: '14px',
                                                lineHeight: '1.4',
                                                padding: '10px 60px 10px 16px'
                                            }}
                                        />
                                        <div className="input-actions">
                                            <button
                                                type="button"
                                                className="emoji-btn"
                                                title={t('chat.addEmoji')}
                                                onClick={() => setShowEmojiPicker(!showEmojiPicker)}
                                            >
                                                <i className="bi bi-emoji-smile"></i>
                                            </button>
                                            <button
                                                type="button"
                                                className="attach-btn"
                                                title={t('chat.attachFile')}
                                            >
                                                <i className="bi bi-paperclip"></i>
                                            </button>
                                        </div>

                                        {/* Emoji Picker */}
                                        {showEmojiPicker && (
                                            <div className="emoji-picker">
                                                <div className="emoji-grid">
                                                    {quickEmojis.map((emoji, index) => (
                                                        <button
                                                            key={index}
                                                            className="emoji-item"
                                                            onClick={() => addEmoji(emoji)}
                                                        >
                                                            {emoji}
                                                        </button>
                                                    ))}
                                                </div>
                                                <div className="emoji-picker-footer">
                                                    <small>{t('chat.quickEmojis')}</small>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                    <button
                                        onClick={sendMessage}
                                        disabled={!message.trim() || isSending}
                                        className={`send-btn ${isSending ? 'sending' : ''}`}
                                        aria-label={t('chat.sendMessage')}
                                    >
                                        {isSending ? (
                                            <div className="sending-spinner"></div>
                                        ) : (
                                            <i className="bi bi-send"></i>
                                        )}
                                    </button>
                                </div>
                                <div className="input-footer">
                                    <div className="input-hint">
                                        {t('chat.inputHint')}
                                    </div>
                                    {showCharCount && (
                                        <div className={`char-count ${message.length > 1900 ? 'warning' : ''}`}>
                                            {message.length}/2000
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            <style>{`
        .floating-chat-button {
          position: fixed;
          bottom: 24px;
          right: 100px;
          z-index: 1350;
          transition: all 0.3s ease;
        }

        .floating-chat-button.hidden {
          opacity: 0;
          pointer-events: none;
        }

        .chat-fab {
          width: 64px;
          height: 64px;
          border-radius: 50%;
          background: linear-gradient(135deg, #007bff 0%, #0056b3 100%);
          border: none;
          color: white;
          font-size: 24px;
          cursor: pointer;
          box-shadow: 0 8px 32px rgba(0, 123, 255, 0.3);
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
          position: relative;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .chat-fab:hover {
          transform: scale(1.1);
          box-shadow: 0 12px 48px rgba(0, 123, 255, 0.4);
        }

        .unread-badge {
          position: absolute;
          top: -8px;
          right: -8px;
          background: #dc3545;
          color: white;
          border-radius: 50%;
          min-width: 24px;
          height: 24px;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 12px;
          font-weight: bold;
          border: 2px solid white;
        }

        .chat-dialog-overlay {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: rgba(0, 0, 0, 0.5);
          z-index: 1400;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 20px;
        }

        .chat-dialog {
          width: 450px;
          min-width: 350px;
          max-width: 90vw;
          height: 650px;
          min-height: 500px;
          max-height: 85vh;
          background: white;
          border-radius: 12px;
          overflow: hidden;
          box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
          display: flex;
          flex-direction: column;
          position: relative;
        }

        .chat-header {
          background: linear-gradient(135deg, #007bff 0%, #0056b3 100%);
          color: white;
          padding: 16px;
          display: flex;
          align-items: center;
          justify-content: space-between;
          position: sticky;
          top: 0;
          z-index: 20;
          border-bottom: 1px solid rgba(255, 255, 255, 0.1);
        }

        .chat-header-content {
          display: flex;
          align-items: center;
          gap: 12px;
        }

        .admin-avatar {
          width: 40px;
          height: 40px;
          border-radius: 50%;
          background: rgba(255, 255, 255, 0.2);
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 20px;
        }

        .chat-title h4 {
          margin: 0;
          font-size: 18px;
          font-weight: 600;
        }

        .online-status {
          display: flex;
          align-items: center;
          gap: 6px;
          font-size: 12px;
          opacity: 0.9;
        }

        .online-dot {
          width: 8px;
          height: 8px;
          border-radius: 50%;
          background: #4CAF50;
          animation: pulse 2s infinite;
        }

        @keyframes pulse {
          0% {
            box-shadow: 0 0 0 0 rgba(76, 175, 80, 0.7);
          }
          70% {
            box-shadow: 0 0 0 10px rgba(76, 175, 80, 0);
          }
          100% {
            box-shadow: 0 0 0 0 rgba(76, 175, 80, 0);
          }
        }

        .close-chat-btn {
          background: none;
          border: none;
          color: white;
          font-size: 24px;
          cursor: pointer;
          padding: 8px;
          border-radius: 4px;
          transition: background 0.2s;
        }

        .close-chat-btn:hover {
          background: rgba(255, 255, 255, 0.1);
        }

        .chat-content {
          flex: 1;
          display: flex;
          flex-direction: column;
          background: #f8f9fa;
        }

        .messages-area {
          flex: 1;
          padding: 16px;
          padding-bottom: 100px;
          overflow-y: auto;
          overflow-x: hidden;
          display: flex;
          flex-direction: column;
          gap: 8px;
          scroll-behavior: smooth;
          scrollbar-width: thin;
          scrollbar-color: #c1c1c1 #f1f1f1;
          max-height: calc(100vh - 200px);
          min-height: 300px;
        }

        .loading-messages {
          text-align: center;
          padding: 40px 20px;
          color: #6c757d;
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 16px;
        }

        .loading-spinner {
          width: 32px;
          height: 32px;
          border: 3px solid #f3f3f3;
          border-top: 3px solid #007bff;
          border-radius: 50%;
          animation: spin 1s linear infinite;
        }

        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }

        .empty-chat {
          text-align: center;
          padding: 40px 20px;
          color: #6c757d;
        }

        .empty-chat i {
          font-size: 48px;
          margin-bottom: 16px;
          color: #dee2e6;
        }

        .empty-chat p {
          margin: 8px 0;
          font-weight: 500;
        }

        .empty-chat small {
          color: #adb5bd;
        }

        .message {
          display: flex;
          margin-bottom: 12px;
          width: 100%;
        }

        .message.own {
          justify-content: flex-end;
          align-items: flex-end;
        }

        .message.other {
          justify-content: flex-start;
          align-items: flex-start;
        }

        .message-bubble {
          max-width: 75%;
          min-width: 60px;
          padding: 12px 16px;
          border-radius: 18px;
          background: white;
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
          position: relative;
          word-wrap: break-word;
          word-break: break-word;
        }

        .message.own .message-bubble {
          background: linear-gradient(135deg, #007bff 0%, #0056b3 100%);
          color: white;
          border-bottom-right-radius: 4px;
          margin-left: auto;
          margin-right: 0;
        }

        .message.other .message-bubble {
          border-bottom-left-radius: 4px;
          background: #fff;
          border: 1px solid #e9ecef;
          margin-left: 0;
          margin-right: auto;
        }

        .message-bubble.typing {
          font-style: italic;
          opacity: 0.7;
          background: #e9ecef;
        }

        .message-bubble p {
          margin: 0 0 4px 0;
          line-height: 1.4;
          word-wrap: break-word;
        }

        .message-time {
          font-size: 11px;
          opacity: 0.7;
        }

        .message-input-area {
          padding: 16px;
          background: white;
          border-top: 2px solid #e9ecef;
          box-shadow: 0 -2px 10px rgba(0, 0, 0, 0.05);
          position: sticky;
          bottom: 0;
          z-index: 10;
          min-height: 80px;
          max-height: 120px;
          display: flex;
          flex-direction: column;
          justify-content: flex-end;
          margin-top: auto;
        }

        .input-container {
          display: flex;
          gap: 12px;
          align-items: flex-end;
          width: 100%;
          max-width: 100%;
        }

        .input-wrapper {
          width: calc(100% - 60px);
          min-width: 200px;
          position: relative;
          background: #f8f9fa;
          border-radius: 20px;
          border: 2px solid #e9ecef;
          transition: all 0.2s ease;
          flex: 1;
        }

        .input-wrapper:focus-within {
          border-color: #007bff;
          box-shadow: 0 0 0 3px rgba(0, 123, 255, 0.1);
          background: white;
        }

        .message-input {
          width: 100%;
          padding: 10px 60px 10px 16px;
          border: none;
          border-radius: 20px;
          resize: none;
          outline: none;
          font-family: inherit;
          font-size: 14px;
          line-height: 1.3;
          background: transparent;
          min-height: 18px;
          max-height: 100px;
          overflow-y: auto;
        }

        .message-input::placeholder {
          color: #adb5bd;
        }

        .message-input:disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }

        .input-actions {
          position: absolute;
          right: 8px;
          top: 50%;
          transform: translateY(-50%);
          display: flex;
          gap: 4px;
        }

        .emoji-btn,
        .attach-btn {
          width: 32px;
          height: 32px;
          border: none;
          background: none;
          color: #6c757d;
          border-radius: 50%;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 16px;
          transition: all 0.2s ease;
        }

        .emoji-btn:hover,
        .attach-btn:hover {
          background: #f1f3f4;
          color: #007bff;
        }

        .send-btn {
          width: 48px;
          min-width: 48px;
          height: 40px;
          border-radius: 50%;
          border: none;
          background: linear-gradient(135deg, #007bff 0%, #0056b3 100%);
          color: white;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: all 0.2s ease;
          font-size: 16px;
          flex-shrink: 0;
        }

        .send-btn:hover:not(:disabled) {
          transform: scale(1.05);
          box-shadow: 0 4px 12px rgba(0, 123, 255, 0.3);
        }

        .send-btn:disabled {
          background: #6c757d;
          cursor: not-allowed;
          transform: none;
          opacity: 0.6;
        }

        .send-btn.sending {
          background: #28a745;
        }

        .sending-spinner {
          width: 20px;
          height: 20px;
          border: 2px solid rgba(255, 255, 255, 0.3);
          border-top: 2px solid white;
          border-radius: 50%;
          animation: spin 1s linear infinite;
        }

        .input-footer {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-top: 8px;
          gap: 12px;
        }

        .input-hint {
          font-size: 12px;
          color: #6c757d;
          opacity: 0.7;
          flex: 1;
        }

        .char-count {
          font-size: 11px;
          color: #6c757d;
          background: #f8f9fa;
          padding: 4px 8px;
          border-radius: 12px;
          font-weight: 500;
        }

        .char-count.warning {
          color: #dc3545;
          background: #f8d7da;
        }

        .emoji-picker {
          position: absolute;
          bottom: 100%;
          right: 0;
          background: white;
          border: 1px solid #e9ecef;
          border-radius: 12px;
          box-shadow: 0 8px 24px rgba(0, 0, 0, 0.15);
          z-index: 1450;
          min-width: 240px;
          margin-bottom: 8px;
        }

        .emoji-grid {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 4px;
          padding: 12px;
        }

        .emoji-item {
          width: 40px;
          height: 40px;
          border: none;
          background: none;
          border-radius: 8px;
          cursor: pointer;
          font-size: 20px;
          transition: all 0.2s ease;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .emoji-item:hover {
          background: #f8f9fa;
          transform: scale(1.1);
        }

        .emoji-picker-footer {
          padding: 8px 12px;
          border-top: 1px solid #f1f3f4;
          text-align: center;
        }

        .emoji-picker-footer small {
          color: #6c757d;
          font-size: 11px;
        }

        /* Scrollbar styling */
        .messages-area::-webkit-scrollbar,
        .message-input::-webkit-scrollbar {
          width: 6px;
        }

        .messages-area::-webkit-scrollbar-track,
        .message-input::-webkit-scrollbar-track {
          background: #f1f1f1;
          border-radius: 3px;
        }

        .messages-area::-webkit-scrollbar-thumb,
        .message-input::-webkit-scrollbar-thumb {
          background: #c1c1c1;
          border-radius: 3px;
        }

        .messages-area::-webkit-scrollbar-thumb:hover,
        .message-input::-webkit-scrollbar-thumb:hover {
          background: #a8a8a8;
        }

        @media (max-width: 768px) {
          .floating-chat-button {
            bottom: 16px;
            right: 80px;
          }
        }

        @media (max-width: 480px) {
          .chat-dialog {
            width: 100vw;
            height: 100vh;
            max-height: 100vh;
            max-width: 100vw;
            border-radius: 0;
            margin: 0;
          }
          
          .floating-chat-button {
            bottom: 100px;
            right: 16px;
          }
          
          .chat-fab {
            width: 56px;
            height: 56px;
            font-size: 20px;
          }

          .input-container {
            gap: 8px;
            padding: 0 8px;
          }

          .input-wrapper {
            width: calc(100% - 56px);
            min-width: 150px;
          }

          .send-btn {
            width: 44px;
            min-width: 44px;
            height: 44px;
            font-size: 16px;
          }

          .message-input {
            padding: 12px 50px 12px 16px;
            font-size: 16px; /* Prevents zoom on iOS */
          }

          .messages-area {
            padding: 12px;
          }

          .message-bubble {
            max-width: 85%;
          }
        }
      `}</style>
        </>
    );
};

export default FloatingAdminChat; 
// import React, { useState, useEffect, useRef } from 'react';
// import { useTranslation } from 'react-i18next';
// import { useCreateSocket } from '../contexts/socket';
// import { ChatAPI } from '../app/api/chat';
// import { MessageAPI } from '../app/api/messages';
// import { UserAPI } from '../app/api/users';
// import useAuth from '../hooks/useAuth';
// import { useAdminMessageNotifications } from '../hooks/useAdminMessageNotifications';

// // Import ApiResponse type
// import { ApiResponse } from '../types/ApiResponse';

// interface Message {
//   _id: string;
//   message: string;
//   sender: string;
//   reciver: string;
//   idChat: string;
//   createdAt: string;
// }

// interface AdminChat {
//   _id: string;
//   users: Array<{
//     _id: string;
//     firstName: string;
//     lastName: string;
//     AccountType: string;
//   }>;
//   createdAt: string;
// }

// // Helper function to extract data from API response and handle type conversions
// function extractData<T>(response: any): T {
//   let result;
  
//   if (response && typeof response === 'object') {
//     // Handle ApiResponse format
//     if ('data' in response) {
//       result = response.data;
//     } else {
//       result = response;
//     }
//   } else {
//     result = response;
//   }
  
//   // Force type casting to handle type incompatibilities
//   return result as unknown as T;
// }

// const FloatingAdminChat: React.FC = () => {
//   const { t } = useTranslation();
//   const { auth } = useAuth();
//   const socketContext = useCreateSocket();

//   // Check if we're on auth-related pages and disable chat entirely
//   const isOnAuthPage = typeof window !== 'undefined' && (
//     window.location.pathname.includes('/login') ||
//     window.location.pathname.includes('/register') ||
//     window.location.pathname.includes('/otp-verification') ||
//     window.location.pathname.includes('/reset-password') ||
//     window.location.pathname.includes('/identity-verification') ||
//     window.location.pathname.includes('/subscription-plans')
//   );
  
//   // Use the new admin message notifications hook
//   const { unreadAdminMessagesCount, adminNotifications, refreshNotifications, clearSocketMessages } = useAdminMessageNotifications();
  
//   const [isOpen, setIsOpen] = useState(false);
//   const [message, setMessage] = useState('');
//   const [messages, setMessages] = useState<Message[]>([]);
//   const [adminChat, setAdminChat] = useState<AdminChat | null>(null);
//   const [isTyping, setIsTyping] = useState(false);
//   const [unreadCount, setUnreadCount] = useState(0);
//   const [isLoading, setIsLoading] = useState(false);
//   const [isSending, setIsSending] = useState(false);
//   const [showEmojiPicker, setShowEmojiPicker] = useState(false);
//   const [showCharCount, setShowCharCount] = useState(false);
  
//   const messagesEndRef = useRef<HTMLDivElement>(null);
//   const typingTimeoutRef = useRef<NodeJS.Timeout | undefined>(undefined);
//   const textareaRef = useRef<HTMLTextAreaElement>(null);

//   // Auto-scroll to bottom
//   const scrollToBottom = () => {
//     messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
//   };

//   useEffect(() => {
//     scrollToBottom();
//   }, [messages]);

//   // Auto-resize textarea
//   const adjustTextareaHeight = () => {
//     const textarea = textareaRef.current;
//     if (textarea) {
//       textarea.style.height = 'auto';
//       const newHeight = Math.min(textarea.scrollHeight, 100); // Max height of 100px
//       textarea.style.height = newHeight + 'px';
//     }
//   };

//   useEffect(() => {
//     adjustTextareaHeight();
//   }, [message]);

//   // Close emoji picker when clicking outside
//   useEffect(() => {
//     const handleClickOutside = (event: MouseEvent) => {
//       if (showEmojiPicker && !((event.target as Element)?.closest('.emoji-picker') || (event.target as Element)?.closest('.emoji-btn'))) {
//         setShowEmojiPicker(false);
//       }
//     };

//     document.addEventListener('mousedown', handleClickOutside);
//     return () => {
//       document.removeEventListener('mousedown', handleClickOutside);
//     };
//   }, [showEmojiPicker]);

//   // Initialize admin chat
//   const initializeAdminChat = async () => {
//     if (!auth?.user?._id || !auth?.tokens?.accessToken) {
//       console.log('FloatingAdminChat: User not authenticated, skipping chat initialization');
//       return;
//     }

//     if (isOnAuthPage) {
//       console.log('FloatingAdminChat: On auth page, completely skipping chat initialization');
//       return;
//     }

//     // Additional safety check - verify auth state from localStorage
//     const authFromStorage = typeof window !== 'undefined' ? window.localStorage.getItem('auth') : null;
//     if (!authFromStorage) {
//       console.log('FloatingAdminChat: No auth in localStorage, skipping chat initialization');
//       return;
//     }

//     let parsedAuth;
//     try {
//       parsedAuth = JSON.parse(authFromStorage);
//     } catch (error) {
//       console.error('FloatingAdminChat: Error parsing auth from localStorage:', error);
//       return;
//     }

//     const { tokens, user } = parsedAuth;
//     if (!tokens?.accessToken || !user?._id || user._id !== auth.user._id) {
//       console.log('FloatingAdminChat: Incomplete or mismatched auth data, skipping initialization');
//       return;
//     }

//     console.log('FloatingAdminChat: All auth checks passed, initializing chat');
//     setIsLoading(true);
//     try {
//       // Get existing chats to find admin chat
//       const chatResponse = await ChatAPI.getChats({
//         id: auth.user._id, 
//         from: 'buyer' 
//       });
      
//       // Extract data from response and properly cast to AdminChat[]
//       const existingChats = extractData<AdminChat[]>(chatResponse);

//       // Find admin chat (admin has AccountType = 'admin')
//       const adminChatExists = existingChats?.find((chat: AdminChat) =>
//         chat.users.some(user => user.AccountType === 'admin')
//         );

//         if (adminChatExists) {
//           setAdminChat(adminChatExists);
//           // Load messages for this chat
//         const messagesResponse = await MessageAPI.getByConversation(adminChatExists._id);
//         setMessages(extractData<Message[]>(messagesResponse) || []);
//         } else {
//         console.log('No admin chat found, will create on first message');
//       }
//     } catch (error) {
//       console.error('Error initializing admin chat:', error);
//     } finally {
//       setIsLoading(false);
//     }
//   };

//   // Create admin chat if it doesn't exist
//   const createAdminChat = async () => {
//     if (!auth?.user?._id || !auth?.tokens?.accessToken) {
//       console.log('FloatingAdminChat: User not authenticated, cannot create chat');
//       return null;
//     }

//     if (isOnAuthPage) {
//       console.log('FloatingAdminChat: On auth page, cannot create chat');
//       return null;
//     }

//     try {
//       // First try to get admin users from API
//         let adminUsers = [];
//       try {
//         const adminsResponse = await UserAPI.getAdmins();
//           adminUsers = extractData<any[]>(adminsResponse) || [];
//         } catch (apiError) {
//         console.log('Could not fetch admin users, will create default admin for chat');
//       }
      
//       let adminUser;
      
//         if (adminUsers && adminUsers.length > 0) {
//         // Use existing admin user
//         adminUser = {
//             _id: adminUsers[0]._id,
//             firstName: adminUsers[0].firstName || 'Admin',
//             lastName: adminUsers[0].lastName || 'Support',
//           AccountType: 'admin',
//             phone: adminUsers[0].phone || ''
//         };
//       } else {
//         // Create a default admin for chat purposes
//         try {
//           await UserAPI.createAdmin?.(); // Create admin if endpoint exists
//           // Retry getting admins
//             const newAdminsResponse = await UserAPI.getAdmins();
//             const newAdmins = extractData<any[]>(newAdminsResponse) || [];
//             if (newAdmins && newAdmins.length > 0) {
//             adminUser = {
//                 _id: newAdmins[0]._id,
//                 firstName: newAdmins[0].firstName || 'Admin',
//                 lastName: newAdmins[0].lastName || 'Support',
//               AccountType: 'admin',
//                 phone: newAdmins[0].phone || ''
//             };
//           }
//         } catch (createError) {
//           console.log('Could not create admin user, using fallback');
//           // Fallback: use a placeholder admin (this should be replaced with actual admin creation)
//           adminUser = {
//             _id: 'admin-support-id',
//             firstName: 'Admin',
//             lastName: 'Support',
//             AccountType: 'admin',
//             phone: ''
//           };
//         }
//       }

//       if (!adminUser) {
//         console.error('Could not resolve admin user');
//         return null;
//       }

//       const chatData = {
//         users: [
//           // Admin user first as requested
//           adminUser,
//           // Current user second
//           {
//             _id: auth.user._id,
//             firstName: auth.user.firstName,
//             lastName: auth.user.lastName,
//             AccountType: auth.user.type || 'buyer',
//             phone: auth.user.phone || ''
//           }
//         ],
//         createdAt: new Date().toISOString()
//       };

//       const chatResponse = await ChatAPI.createChat(chatData);
//       const newChat = extractData<AdminChat>(chatResponse);
//       setAdminChat(newChat);
//       return newChat;
//     } catch (error) {
//       console.error('Error creating admin chat:', error);
//       return null;
//     }
//   };

//   // Send message
//   const sendMessage = async () => {
//     if (!message.trim() || !auth?.user?._id || !auth?.tokens?.accessToken || isSending) {
//       if (!auth?.tokens?.accessToken) {
//         console.log('FloatingAdminChat: User not authenticated, cannot send message');
//       }
//       return;
//     }

//     console.log('📤 Sending message:', message.trim());
//     console.log('📤 Current user:', auth.user._id);
//     console.log('📤 Current chat:', adminChat);

//     setIsSending(true);
//     let currentChat = adminChat;

//     // Create chat if it doesn't exist
//     if (!currentChat) {
//       console.log('📤 Creating new admin chat');
//       currentChat = await createAdminChat();
//       if (!currentChat) {
//         console.error('❌ Failed to create admin chat');
//         setIsSending(false);
//         return;
//       }
//     }

//     // Always set sender/reciver as required
//     const sender = auth.user._id;
//     let reciver = 'admin';  // Always send to 'admin' which will go to all admins

//     console.log('📤 Message data:', {
//       sender,
//       reciver,
//       message: message.trim(),
//       idChat: currentChat._id
//     });

//     try {
//       const messageData = {
//         idChat: currentChat._id,
//         message: message.trim(),
//         sender,
//         reciver,
//       };

//       console.log('📤 Sending via API:', messageData);
//       await MessageAPI.send(messageData);
//       console.log('✅ Message sent successfully');

//       setMessage('');
//       // Refresh messages
//       const updatedMessagesResponse = await MessageAPI.getByConversation(currentChat._id);
//       setMessages(extractData<Message[]>(updatedMessagesResponse) || []);
//       console.log('✅ Messages refreshed');
//     } catch (error) {
//       console.error('❌ Error sending message:', error);
//     } finally {
//       setIsSending(false);
//     }
//   };

//   // Handle socket messages
//   useEffect(() => {
//     if (!socketContext?.socket) {
//       console.log('❌ Socket not available in FloatingAdminChat');
//       return;
//     }

//     console.log('🔌 Socket status in FloatingAdminChat:', {
//       connected: socketContext.socket.connected,
//       id: socketContext.socket.id
//     });

//     const handleNewMessage = (data: Message) => {
//       console.log('📨 Received socket message:', data);
//       console.log('📨 Current adminChat:', adminChat);

//       // Check if this message belongs to our admin chat
//       const isAdminMessage = data.reciver === 'admin' || data.sender === 'admin';
//       const isFromCurrentUser = data.sender === auth?.user?._id;
//       const isToCurrentUser = data.reciver === auth?.user?._id;
//       const isInCurrentChat = adminChat && data.idChat === adminChat._id;
      
//       // Special case: adminMessage event (from socket.gateway.ts)
//       const isFromAdminEvent = data.sender === 'admin' && data.reciver === auth?.user?._id;
      
//       console.log('🔍 Message analysis:', {
//         isAdminMessage,
//         isFromCurrentUser,
//         isToCurrentUser,
//         isInCurrentChat,
//         isFromAdminEvent,
//         messageSender: data.sender,
//         messageReceiver: data.reciver,
//         currentUserId: auth?.user?._id,
//         chatId: data.idChat,
//         currentChatId: adminChat?._id
//       });

//       // Accept messages that are either:
//       // 1. From admin to current user (admin responding)
//       // 2. From current user to admin (user asking)
//       // 3. In the same chat as our adminChat (if it exists)
//       // 4. Any message where receiver is 'admin' (broadcast to all users)
//       // 5. Any message where sender is 'admin' and receiver is current user
//       // 6. Any message from adminMessage event (highest priority)
//       const shouldAcceptMessage = 
//         isFromAdminEvent || // Always accept admin messages
//         (isAdminMessage && (isFromCurrentUser || isToCurrentUser)) ||
//         isInCurrentChat ||
//         (data.reciver === 'admin' && isFromCurrentUser) ||
//         (data.sender === 'admin' && isToCurrentUser) ||
//         (data.sender === 'admin' && data.reciver === auth?.user?._id);

//       if (shouldAcceptMessage) {
//         console.log('✅ Accepting message, adding to messages');
        
//         // If we don't have an admin chat yet but received an admin message,
//         // we should initialize the chat next time it's opened
//         if (data.sender === 'admin' && !adminChat) {
//           console.log('⚠️ Received admin message but no chat initialized yet');
//         }
        
//         setMessages(prev => {
//           // More robust message deduplication logic
//           const isDuplicate = prev.some(msg => {
//             // Check by ID if available
//             if (msg._id && data._id && msg._id === data._id) {
//               return true;
//             }
            
//             // As fallback, check by content + sender + timestamp
//             if (
//               msg.message === data.message &&
//               msg.sender === data.sender &&
//               msg.idChat === data.idChat &&
//               Math.abs(new Date(msg.createdAt).getTime() - new Date(data.createdAt).getTime()) < 1000
//             ) {
//               return true;
//             }
            
//             return false;
//           });
          
//           if (isDuplicate) {
//             console.log('⚠️ Message already exists, skipping duplicate');
//             return prev;
//           }
          
//           console.log('✅ Adding new message to state');
//           return [...prev, data];
//         });

//         // Only increment unread count if the message is FROM ADMIN and chat is not open
//         if (!isOpen && data.sender === 'admin') {
//           console.log('📊 Incrementing unread count for admin message');
//           setUnreadCount(prev => prev + 1);
//         }
        
//         // Auto-scroll to bottom after adding the message
//         setTimeout(scrollToBottom, 100);
//       } else {
//         console.log('❌ Message not for this chat, ignoring');
//       }
//     };

//     console.log('🔌 Setting up socket listeners for messages');
//     socketContext.socket.on('sendMessage', handleNewMessage);
    
//     // Add specific listener for adminMessage events with higher priority
//     socketContext.socket.on('adminMessage', (data: Message) => {
//       console.log('📨 Received adminMessage event:', data);
//       console.log('📨 Message data:', data);
      
//       // Force the sender to be 'admin' to ensure proper handling
//       const adminMessage = {
//         ...data,
//         sender: 'admin'
//       };
      
//       // Use the same handler for adminMessage events
//       handleNewMessage(adminMessage);
//     });

//     // Test socket connection by emitting a test event
//     if (socketContext.socket.connected) {
//       console.log('🔌 Socket is connected, testing with a test event');
//       socketContext.socket.emit('test', { message: 'Test from FloatingAdminChat' });
//     }

//     // Add test event listeners
//     const handleTestResponse = (data: any) => {
//       console.log('🧪 Test response received:', data);
//     };

//     const handleTestBroadcast = (data: any) => {
//       console.log('🧪 Test broadcast received:', data);
//     };

//     // Handle notifications - now using the admin notifications hook
//     const handleNotification = (notification: any) => {
//       console.log('🔔 Received notification:', notification);
      
//       // Check if this notification is for the current user
//       const isForCurrentUser = notification.userId === auth?.user?._id;
//       const isAdminMessageNotification = notification.type === 'MESSAGE_ADMIN' || notification.type === 'MESSAGE_RECEIVED';
      
//       if (isForCurrentUser && isAdminMessageNotification) {
//         console.log('✅ Accepting notification for current user');
//         // Refresh admin notifications to update unread count
//         refreshNotifications();
//       }
//     };

//     socketContext.socket.on('testResponse', handleTestResponse);
//     socketContext.socket.on('testBroadcast', handleTestBroadcast);
//     socketContext.socket.on('notification', handleNotification);
    
//     return () => {
//       console.log('🔌 Cleaning up socket listeners');
//       socketContext.socket?.off('sendMessage', handleNewMessage);
//       socketContext.socket?.off('adminMessage', handleNewMessage);
//       socketContext.socket?.off('testResponse', handleTestResponse);
//       socketContext.socket?.off('testBroadcast', handleTestBroadcast);
//       socketContext.socket?.off('notification', handleNotification);
//     };
//   }, [socketContext?.socket, adminChat, isOpen, auth?.user?._id]);

//   // Initialize chat when component mounts - with delays and auth page guards
//   useEffect(() => {
//     if (isOnAuthPage) {
//       return; // Silent return on auth pages
//     }

//     if (auth?.user && auth?.tokens?.accessToken) {
//       // Add delay to ensure authentication is fully complete before making API calls
//       const timeoutId = setTimeout(() => {
//         if (!isOnAuthPage && auth?.user && auth?.tokens?.accessToken) {
//           console.log('FloatingAdminChat: Initializing chat for user:', auth.user._id);
//       initializeAdminChat();
//       refreshNotifications();
//     }
//       }, 2000); // Reduced to 2 seconds

//       return () => clearTimeout(timeoutId);
//     }
//   }, [auth?.user?._id, auth?.tokens?.accessToken]); // Simplified dependencies

//   // Update unread count from admin notifications
//   useEffect(() => {
//     setUnreadCount(unreadAdminMessagesCount);
//   }, [unreadAdminMessagesCount]);

//   // Reset unread count when opening chat
//   useEffect(() => {
//     if (isOpen) {
//       setUnreadCount(0);
//       clearSocketMessages(); // Clear unread messages when chat is opened
//     }
//   }, [isOpen, clearSocketMessages]);

//   // Debug: Log messages state changes
//   useEffect(() => {
//     console.log('📝 Messages state changed:', messages);
//     console.log('📝 Number of messages:', messages.length);
//   }, [messages]);

//   const handleKeyPress = (e: React.KeyboardEvent) => {
//     if (e.key === 'Enter' && !e.shiftKey) {
//       e.preventDefault();
//       sendMessage();
//     }
//   };

//   const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
//     const value = e.target.value;
//     if (value.length <= 2000) { // Max character limit
//       setMessage(value);
//     }
    
//     // Show character count when approaching limit
//     setShowCharCount(value.length > 1800);
    
//     // Clear typing timeout if it exists
//     if (typingTimeoutRef.current) {
//       clearTimeout(typingTimeoutRef.current);
//     }
    
//     // Set new typing timeout
//     typingTimeoutRef.current = setTimeout(() => {
//       // Handle typing indicator logic here if needed
//     }, 1000);
//   };

//   // Add emoji to message
//   const addEmoji = (emoji: string) => {
//     setMessage(prev => prev + emoji);
//     setShowEmojiPicker(false);
//   };

//   // Common emojis for quick access
//   const quickEmojis = ['😊', '😂', '❤️', '👍', '🎉', '🔥', '✨', '🙏'];

//   const formatTime = (dateString: string) => {
//     const date = new Date(dateString);
//     return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
//   };

//   const isOwnMessage = (senderId: string) => senderId === auth?.user?._id;

//   // Don't render the component at all on auth pages
//   if (isOnAuthPage) {
//     console.log('FloatingAdminChat: On auth page, not rendering component');
//     return null;
//   }

//   return (
//     <>
//       {/* Floating Action Button */}
//       <div className={`floating-chat-button ${isOpen ? 'hidden' : ''}`}>
//         <button 
//           className="chat-fab" 
//           onClick={async () => {
//             if (!auth?.user?._id || !auth?.tokens?.accessToken) {
//               console.log('FloatingAdminChat: User not authenticated, cannot open chat');
//               return;
//             }
            
//             if (isOnAuthPage) {
//               console.log('FloatingAdminChat: On auth page, cannot open chat');
//               return;
//             }

//             // Show chat dialog immediately for better UX
//             setIsOpen(true);
//             setIsLoading(true);
              
//             try {
//               // 1. Get all chats for this user
//               const chatsResponse = await ChatAPI.getChats({
//                 id: auth.user._id, 
//                 from: 'buyer' 
//               });
              
//               // Extract data and properly cast
//               const existingChats = extractData<AdminChat[]>(chatsResponse);
              
//               // 2. Check if a chat with admin exists
//               const adminChatExists = existingChats?.find((chat: AdminChat) =>
//                   chat.users.some(user => user._id === 'admin' || user.AccountType === 'admin') &&
//                   chat.users.some(user => user._id === auth.user?._id)
//               );
              
//               if (adminChatExists) {
//                 setAdminChat(adminChatExists);
//                 // Load messages
//                 const messagesResponse = await MessageAPI.getByConversation(adminChatExists._id);
//                 setMessages(extractData<Message[]>(messagesResponse) || []);
                
//                 // Mark all messages in this chat as read
//                 try {
//                   await MessageAPI.markAllAsRead(adminChatExists._id);
//                   console.log('✅ All admin messages marked as read for chat:', adminChatExists._id);
//                   // Immediately reset local unread count for instant UI feedback
//                   setUnreadCount(0);
//                   // Refresh admin notifications to update unread count
//                   refreshNotifications();
//                 } catch (error) {
//                   console.error('❌ Error marking admin messages as read:', error);
//                 }
                
//                 return;
//               }

//               // 3. If not, create a new chat
//               // Create admin user object
//               const adminUser = {
//                     _id: 'admin', 
//                     AccountType: 'admin', 
//                     firstName: 'Admin', 
//                     lastName: 'Support', 
//                     phone: '' 
//               };
              
//               // Create user object
//               const currentUser = {
//                 _id: auth.user._id,
//                 AccountType: auth.user.type || 'buyer',
//                 firstName: auth.user.firstName,
//                 lastName: auth.user.lastName,
//                 phone: auth.user.phone || ''
//               };
              
//               // Create chat data with admin first, then user
//               const chatData = {
//                 users: [
//                   adminUser,  // Admin user first as requested
//                   currentUser // Current user second
//                 ],
//                 createdAt: new Date().toISOString()
//               };

//               const newChatResponse = await ChatAPI.createChat(chatData);
//               const newChat = extractData<AdminChat>(newChatResponse);
//               setAdminChat(newChat);
              
//               // Load messages
//               const messagesResponse = await MessageAPI.getByConversation(newChat._id);
//               setMessages(extractData<Message[]>(messagesResponse) || []);

//               // Mark all messages in this chat as read (in case there are any)
//               try {
//                 await MessageAPI.markAllAsRead(newChat._id);
//                 console.log('✅ All admin messages marked as read for new chat:', newChat._id);
//                 // Immediately reset local unread count for instant UI feedback
//                 setUnreadCount(0);
//                 // Refresh admin notifications to update unread count
//                 refreshNotifications();
//               } catch (error) {
//                 console.error('❌ Error marking admin messages as read in new chat:', error);
//               }
//             } catch (error) {
//               console.error('Error handling Floating Admin Chat:', error);
//               // On error, you might want to close the chat or show an error message
//               // setIsOpen(false); // Uncomment if you want to close on error
//             } finally {
//               setIsLoading(false);
//             }
//           }}
//           aria-label={t('chat.openAdminChat')}
//         >
//           <i className="bi bi-headset"></i>
//           {unreadCount > 0 && (
//             <span className="unread-badge">{unreadCount}</span>
//           )}
//         </button>
//       </div>

//       {/* Chat Dialog */}
//       {isOpen && (
//         <div className="chat-dialog-overlay" onClick={(e) => {
//           if (e.target === e.currentTarget) setIsOpen(false);
//         }}>
//           <div className="chat-dialog">
//             {/* Header */}
//             <div className="chat-header">
//               <div className="chat-header-content">
//                 <div className="admin-avatar">
//                   <i className="bi bi-headset"></i>
//                 </div>
//                 <div className="chat-title">
//                   <h4>{t('chat.adminSupport')}</h4>
//                   <div className="online-status">
//                     <span className="online-dot"></span>
//                     <span>{t('chat.online')}</span>
//                   </div>
//                 </div>
//               </div>
            
//               <button 
//                 className="close-chat-btn" 
//                 onClick={() => setIsOpen(false)}
//                 aria-label={t('chat.closeChat')}
//               >
//                 <i className="bi bi-x"></i>
//               </button>
//             </div>

//             {/* Messages Area */}
//             <div className="chat-content">
//               <div className="messages-area">
//                 {isLoading ? (
//                   <div className="loading-messages">
//                     <div className="loading-spinner"></div>
//                     <p>{t('chat.loadingMessages')}</p>
//                   </div>
//                 ) : messages.length === 0 ? (
//                   <div className="empty-chat">
//                     <i className="bi bi-chat-dots"></i>
//                     <p>{t('chat.startConversation')}</p>
//                     <small>{t('chat.hereToHelp')}</small>
//                     {/* Test button for debugging */}
//                     <button
//                       onClick={() => {
//                         const testMessage: Message = {
//                           _id: 'test-' + Date.now(),
//                           message: 'This is a test message from admin',
//                           sender: 'admin',
//                           reciver: auth?.user?._id || '',
//                           idChat: adminChat?._id || 'test-chat',
//                           createdAt: new Date().toISOString()
//                         };
//                         setMessages([testMessage]);
//                         console.log('🧪 Test message added:', testMessage);
//                       }}
//                       style={{
//                         marginTop: '10px',
//                         padding: '8px 16px',
//                         backgroundColor: '#1976d2',
//                         color: 'white',
//                         border: 'none',
//                         borderRadius: '4px',
//                         cursor: 'pointer'
//                       }}
//                     >
//                       {t('chat.addTestMessage')}
//                     </button>
//                   </div>
//                 ) : (
//                   messages.map((msg, index) => {
//                     console.log('📝 Rendering message:', msg);
                    
//                     // Create a truly unique key by combining message ID with index and timestamp
//                     // This ensures uniqueness even if server returns duplicate IDs
//                     const uniqueKey = `${msg._id || 'msg'}-${index}-${Date.parse(msg.createdAt) || index}`;
                    
//                     return (
//                       <div
//                         key={uniqueKey}
//                       className={`message ${isOwnMessage(msg.sender) ? 'own' : 'other'}`}
//                     >
//                       <div className="message-bubble">
//                         <p>{msg.message}</p>
//                         <span className="message-time">
//                           {formatTime(msg.createdAt)}
//                         </span>
//                       </div>
//                     </div>
//                     );
//                   })
//                 )}
                
//                 {isTyping && (
//                   <div className="message other">
//                     <div className="message-bubble typing">
//                       <p><em>{t('chat.adminTyping')}</em></p>
//                     </div>
//                   </div>
//                 )}
                
//                 <div ref={messagesEndRef} />
//               </div>

//               {/* Enhanced Message Input */}
//               <div className="message-input-area">
//                 <div className="input-container">
//                   <div className="input-wrapper">
//                     <textarea
//                       ref={textareaRef}
//                       value={message}
//                       onChange={handleInputChange}
//                       onKeyPress={handleKeyPress}
//                       placeholder={t('chat.typeMessage')}
//                       className="message-input"
//                       disabled={isSending}
//                     />
//                     <div className="input-actions">
//                       <button
//                         type="button"
//                         className="emoji-btn"
//                         title={t('chat.addEmoji')}
//                         onClick={() => setShowEmojiPicker(!showEmojiPicker)}
//                       >
//                         <i className="bi bi-emoji-smile"></i>
//                       </button>
//                       <button
//                         type="button"
//                         className="attach-btn"
//                         title={t('chat.attachFile')}
//                       >
//                         <i className="bi bi-paperclip"></i>
//                       </button>
//                     </div>
                    
//                     {/* Emoji Picker */}
//                     {showEmojiPicker && (
//                       <div className="emoji-picker">
//                         <div className="emoji-grid">
//                           {quickEmojis.map((emoji, index) => (
//                             <button
//                               key={index}
//                               className="emoji-item"
//                               onClick={() => addEmoji(emoji)}
//                             >
//                               {emoji}
//                             </button>
//                           ))}
//                         </div>
//                         <div className="emoji-picker-footer">
//                           <small>{t('chat.quickEmojis')}</small>
//                         </div>
//                       </div>
//                     )}
//                   </div>
//                   <button
//                     onClick={sendMessage}
//                     disabled={!message.trim() || isSending}
//                     className={`send-btn ${isSending ? 'sending' : ''}`}
//                     aria-label={t('chat.sendMessage')}
//                   >
//                     {isSending ? (
//                       <div className="sending-spinner"></div>
//                     ) : (
//                       <i className="bi bi-send"></i>
//                     )}
//                   </button>
//                 </div>
//                 <div className="input-footer">
//                   <div className="input-hint">
//                     {t('chat.inputHint')}
//                   </div>
//                   {showCharCount && (
//                     <div className={`char-count ${message.length > 1900 ? 'warning' : ''}`}>
//                       {message.length}/2000
//                     </div>
//                   )}
//                 </div>
//               </div>
//             </div>
//           </div>
//         </div>
//       )}

//       <style>{`
//         .floating-chat-button {
//           position: fixed;
//           bottom: 24px;
//           right: 100px;
//           z-index: 1350;
//           transition: all 0.3s ease;
//         }

//         .floating-chat-button.hidden {
//           opacity: 0;
//           pointer-events: none;
//         }

//         .chat-fab {
//           width: 64px;
//           height: 64px;
//           border-radius: 50%;
//           background: linear-gradient(135deg, #007bff 0%, #0056b3 100%);
//           border: none;
//           color: white;
//           font-size: 24px;
//           cursor: pointer;
//           box-shadow: 0 8px 32px rgba(0, 123, 255, 0.3);
//           transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
//           position: relative;
//           display: flex;
//           align-items: center;
//           justify-content: center;
//         }

//         .chat-fab:hover {
//           transform: scale(1.1);
//           box-shadow: 0 12px 48px rgba(0, 123, 255, 0.4);
//         }

//         .unread-badge {
//           position: absolute;
//           top: -8px;
//           right: -8px;
//           background: #dc3545;
//           color: white;
//           border-radius: 50%;
//           min-width: 24px;
//           height: 24px;
//           display: flex;
//           align-items: center;
//           justify-content: center;
//           font-size: 12px;
//           font-weight: bold;
//           border: 2px solid white;
//         }

//         .chat-dialog-overlay {
//           position: fixed;
//           top: 0;
//           left: 0;
//           right: 0;
//           bottom: 0;
//           background: rgba(0, 0, 0, 0.5);
//           z-index: 1400;
//           display: flex;
//           align-items: center;
//           justify-content: center;
//           padding: 20px;
//         }

//         .chat-dialog {
//           width: 400px;
//           height: 600px;
//           max-height: 80vh;
//           background: white;
//           border-radius: 12px;
//           overflow: hidden;
//           box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
//           display: flex;
//           flex-direction: column;
//         }

//         .chat-header {
//           background: linear-gradient(135deg, #007bff 0%, #0056b3 100%);
//           color: white;
//           padding: 16px;
//           display: flex;
//           align-items: center;
//           justify-content: space-between;
//         }

//         .chat-header-content {
//           display: flex;
//           align-items: center;
//           gap: 12px;
//         }

//         .admin-avatar {
//           width: 40px;
//           height: 40px;
//           border-radius: 50%;
//           background: rgba(255, 255, 255, 0.2);
//           display: flex;
//           align-items: center;
//           justify-content: center;
//           font-size: 20px;
//         }

//         .chat-title h4 {
//           margin: 0;
//           font-size: 18px;
//           font-weight: 600;
//         }

//         .online-status {
//           display: flex;
//           align-items: center;
//           gap: 6px;
//           font-size: 12px;
//           opacity: 0.9;
//         }

//         .online-dot {
//           width: 8px;
//           height: 8px;
//           border-radius: 50%;
//           background: #4CAF50;
//           animation: pulse 2s infinite;
//         }

//         @keyframes pulse {
//           0% {
//             box-shadow: 0 0 0 0 rgba(76, 175, 80, 0.7);
//           }
//           70% {
//             box-shadow: 0 0 0 10px rgba(76, 175, 80, 0);
//           }
//           100% {
//             box-shadow: 0 0 0 0 rgba(76, 175, 80, 0);
//           }
//         }

//         .close-chat-btn {
//           background: none;
//           border: none;
//           color: white;
//           font-size: 24px;
//           cursor: pointer;
//           padding: 8px;
//           border-radius: 4px;
//           transition: background 0.2s;
//         }

//         .close-chat-btn:hover {
//           background: rgba(255, 255, 255, 0.1);
//         }

//         .chat-content {
//           flex: 1;
//           display: flex;
//           flex-direction: column;
//           background: #f8f9fa;
//         }

//         .messages-area {
//           flex: 1;
//           padding: 16px;
//           overflow-y: auto;
//           display: flex;
//           flex-direction: column;
//           gap: 8px;
//         }

//         .loading-messages {
//           text-align: center;
//           padding: 40px 20px;
//           color: #6c757d;
//           display: flex;
//           flex-direction: column;
//           align-items: center;
//           gap: 16px;
//         }

//         .loading-spinner {
//           width: 32px;
//           height: 32px;
//           border: 3px solid #f3f3f3;
//           border-top: 3px solid #007bff;
//           border-radius: 50%;
//           animation: spin 1s linear infinite;
//         }

//         @keyframes spin {
//           0% { transform: rotate(0deg); }
//           100% { transform: rotate(360deg); }
//         }

//         .empty-chat {
//           text-align: center;
//           padding: 40px 20px;
//           color: #6c757d;
//         }

//         .empty-chat i {
//           font-size: 48px;
//           margin-bottom: 16px;
//           color: #dee2e6;
//         }

//         .empty-chat p {
//           margin: 8px 0;
//           font-weight: 500;
//         }

//         .empty-chat small {
//           color: #adb5bd;
//         }

//         .message {
//           display: flex;
//           margin-bottom: 8px;
//         }

//         .message.own {
//           justify-content: flex-end;
//         }

//         .message.other {
//           justify-content: flex-start;
//         }

//         .message-bubble {
//           max-width: 75%;
//           padding: 12px 16px;
//           border-radius: 18px;
//           background: white;
//           box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
//           position: relative;
//         }

//         .message.own .message-bubble {
//           background: linear-gradient(135deg, #007bff 0%, #0056b3 100%);
//           color: white;
//           border-bottom-right-radius: 4px;
//         }

//         .message.other .message-bubble {
//           border-bottom-left-radius: 4px;
//           background: #fff;
//           border: 1px solid #e9ecef;
//         }

//         .message-bubble.typing {
//           font-style: italic;
//           opacity: 0.7;
//           background: #e9ecef;
//         }

//         .message-bubble p {
//           margin: 0 0 4px 0;
//           line-height: 1.4;
//           word-wrap: break-word;
//         }

//         .message-time {
//           font-size: 11px;
//           opacity: 0.7;
//         }

//         .message-input-area {
//           padding: 16px;
//           background: white;
//           border-top: 1px solid #dee2e6;
//         }

//         .input-container {
//           display: flex;
//           gap: 12px;
//           align-items: flex-end;
//           width: 100%;
//         }

//         .input-wrapper {
//           width: 90%;
//           position: relative;
//           background: #f8f9fa;
//           border-radius: 20px;
//           border: 2px solid #e9ecef;
//           transition: all 0.2s ease;
//         }

//         .input-wrapper:focus-within {
//           border-color: #007bff;
//           box-shadow: 0 0 0 3px rgba(0, 123, 255, 0.1);
//           background: white;
//         }

//         .message-input {
//           width: 100%;
//           padding: 10px 60px 10px 16px;
//           border: none;
//           border-radius: 20px;
//           resize: none;
//           outline: none;
//           font-family: inherit;
//           font-size: 14px;
//           line-height: 1.3;
//           background: transparent;
//           min-height: 18px;
//           max-height: 100px;
//           overflow-y: auto;
//         }

//         .message-input::placeholder {
//           color: #adb5bd;
//         }

//         .message-input:disabled {
//           opacity: 0.6;
//           cursor: not-allowed;
//         }

//         .input-actions {
//           position: absolute;
//           right: 8px;
//           top: 50%;
//           transform: translateY(-50%);
//           display: flex;
//           gap: 4px;
//         }

//         .emoji-btn,
//         .attach-btn {
//           width: 32px;
//           height: 32px;
//           border: none;
//           background: none;
//           color: #6c757d;
//           border-radius: 50%;
//           cursor: pointer;
//           display: flex;
//           align-items: center;
//           justify-content: center;
//           font-size: 16px;
//           transition: all 0.2s ease;
//         }

//         .emoji-btn:hover,
//         .attach-btn:hover {
//           background: #f1f3f4;
//           color: #007bff;
//         }

//         .send-btn {
//           width: calc(10% - 12px);
//           min-width: 40px;
//           height: 40px;
//           border-radius: 50%;
//           border: none;
//           background: linear-gradient(135deg, #007bff 0%, #0056b3 100%);
//           color: white;
//           cursor: pointer;
//           display: flex;
//           align-items: center;
//           justify-content: center;
//           transition: all 0.2s ease;
//           font-size: 16px;
//           flex-shrink: 0;
//         }

//         .send-btn:hover:not(:disabled) {
//           transform: scale(1.05);
//           box-shadow: 0 4px 12px rgba(0, 123, 255, 0.3);
//         }

//         .send-btn:disabled {
//           background: #6c757d;
//           cursor: not-allowed;
//           transform: none;
//           opacity: 0.6;
//         }

//         .send-btn.sending {
//           background: #28a745;
//         }

//         .sending-spinner {
//           width: 20px;
//           height: 20px;
//           border: 2px solid rgba(255, 255, 255, 0.3);
//           border-top: 2px solid white;
//           border-radius: 50%;
//           animation: spin 1s linear infinite;
//         }

//         .input-footer {
//           display: flex;
//           justify-content: space-between;
//           align-items: center;
//           margin-top: 8px;
//           gap: 12px;
//         }

//         .input-hint {
//           font-size: 12px;
//           color: #6c757d;
//           opacity: 0.7;
//           flex: 1;
//         }

//         .char-count {
//           font-size: 11px;
//           color: #6c757d;
//           background: #f8f9fa;
//           padding: 4px 8px;
//           border-radius: 12px;
//           font-weight: 500;
//         }

//         .char-count.warning {
//           color: #dc3545;
//           background: #f8d7da;
//         }

//         .emoji-picker {
//           position: absolute;
//           bottom: 100%;
//           right: 0;
//           background: white;
//           border: 1px solid #e9ecef;
//           border-radius: 12px;
//           box-shadow: 0 8px 24px rgba(0, 0, 0, 0.15);
//           z-index: 1450;
//           min-width: 240px;
//           margin-bottom: 8px;
//         }

//         .emoji-grid {
//           display: grid;
//           grid-template-columns: repeat(4, 1fr);
//           gap: 4px;
//           padding: 12px;
//         }

//         .emoji-item {
//           width: 40px;
//           height: 40px;
//           border: none;
//           background: none;
//           border-radius: 8px;
//           cursor: pointer;
//           font-size: 20px;
//           transition: all 0.2s ease;
//           display: flex;
//           align-items: center;
//           justify-content: center;
//         }

//         .emoji-item:hover {
//           background: #f8f9fa;
//           transform: scale(1.1);
//         }

//         .emoji-picker-footer {
//           padding: 8px 12px;
//           border-top: 1px solid #f1f3f4;
//           text-align: center;
//         }

//         .emoji-picker-footer small {
//           color: #6c757d;
//           font-size: 11px;
//         }

//         /* Scrollbar styling */
//         .messages-area::-webkit-scrollbar,
//         .message-input::-webkit-scrollbar {
//           width: 6px;
//         }

//         .messages-area::-webkit-scrollbar-track,
//         .message-input::-webkit-scrollbar-track {
//           background: #f1f1f1;
//           border-radius: 3px;
//         }

//         .messages-area::-webkit-scrollbar-thumb,
//         .message-input::-webkit-scrollbar-thumb {
//           background: #c1c1c1;
//           border-radius: 3px;
//         }

//         .messages-area::-webkit-scrollbar-thumb:hover,
//         .message-input::-webkit-scrollbar-thumb:hover {
//           background: #a8a8a8;
//         }

//         @media (max-width: 768px) {
//           .floating-chat-button {
//             bottom: 16px;
//             right: 80px;
//           }
//         }

//         @media (max-width: 480px) {
//           .chat-dialog {
//             width: 100%;
//             height: 100%;
//             max-height: 100vh;
//             border-radius: 0;
//           }
          
//           .floating-chat-button {
//             bottom: 100px;
//             right: 16px;
//           }
          
//           .chat-fab {
//             width: 56px;
//             height: 56px;
//             font-size: 20px;
//           }

//           .input-container {
//             gap: 8px;
//           }

//           .send-btn {
//             width: 44px;
//             height: 44px;
//             font-size: 16px;
//           }

//           .message-input {
//             padding: 12px 50px 12px 16px;
//             font-size: 16px; /* Prevents zoom on iOS */
//           }
//         }
//       `}</style>
//     </>
//   );
// };

// export default FloatingAdminChat; 