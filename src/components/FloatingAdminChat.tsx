import React, { useState, useEffect, useRef } from 'react';
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
    status?: 'sending' | 'sent' | 'delivered' | 'read';
    attachment?: {
        _id: string;
        url: string;
        name: string;
        type: string;
        size: number;
        filename: string;
    };
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
    const [guestInfo, setGuestInfo] = useState(() => {
        try {
            const saved = localStorage.getItem('guestChatInfo');
            return saved ? JSON.parse(saved) : { name: '', phone: '' };
        } catch {
            return { name: '', phone: '' };
        }
    });
    const [guestChatId, setGuestChatId] = useState(() => {
        try {
            return localStorage.getItem('guestChatId') || '';
        } catch {
            return '';
        }
    });
    const [showGuestForm, setShowGuestForm] = useState(false);
    // États pour les messages vocaux
    const [isRecording, setIsRecording] = useState(false);
    const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
    const [audioUrl, setAudioUrl] = useState<string>('');
    const mediaRecorderRef = useRef<MediaRecorder | null>(null);
    const audioChunksRef = useRef<Blob[]>([]);
    // États pour les pièces jointes
    const [selectedFile, setSelectedFile] = useState<File | null>(null);
    const [filePreview, setFilePreview] = useState<string>('');
    const [isUploading, setIsUploading] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [selectedImage, setSelectedImage] = useState<{ url: string; name: string } | null>(null);

    const messagesEndRef = useRef<HTMLDivElement>(null);
    const typingTimeoutRef = useRef<NodeJS.Timeout | undefined>(undefined);
    const textareaRef = useRef<HTMLTextAreaElement>(null);

    // Clear guest chat data (for testing or reset)
    const clearGuestChat = () => {
        localStorage.removeItem('guestChatId');
        localStorage.removeItem('guestChatInfo');
        setGuestChatId('');
        setGuestInfo({ name: '', phone: '' });
        setAdminChat(null);
        setMessages([]);
        console.log('🧹 Guest chat data cleared');
    };

    // Fonctions pour les messages vocaux
    const startRecording = async () => {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            const mediaRecorder = new MediaRecorder(stream);
            mediaRecorderRef.current = mediaRecorder;
            audioChunksRef.current = [];

            mediaRecorder.ondataavailable = (event) => {
                if (event.data.size > 0) {
                    audioChunksRef.current.push(event.data);
                }
            };

            mediaRecorder.onstop = () => {
                const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
                setAudioBlob(audioBlob);
                const url = URL.createObjectURL(audioBlob);
                setAudioUrl(url);
                
                // Arrêter tous les tracks du stream
                stream.getTracks().forEach(track => track.stop());
            };

            mediaRecorder.start();
            setIsRecording(true);
        } catch (error) {
            console.error('Erreur lors de la capture audio:', error);
            alert('Impossible d\'accéder au microphone');
        }
    };

    const stopRecording = () => {
        if (mediaRecorderRef.current && isRecording) {
            mediaRecorderRef.current.stop();
            setIsRecording(false);
        }
    };

    const sendVoiceMessage = async () => {
        if (!audioBlob || !adminChat) {
            return;
        }

        setIsSending(true);
        try {
            // Créer un FormData pour envoyer le fichier audio
            const formData = new FormData();
            const isAuthenticated = auth?.user?._id && auth?.tokens?.accessToken;
            
            formData.append('audio', audioBlob, 'voice-message.webm');
            formData.append('idChat', adminChat._id || '');
            formData.append('sender', isAuthenticated ? (auth?.user?._id || 'guest') : 'guest');
            formData.append('reciver', 'admin');
            
            if (!isAuthenticated) {
                formData.append('guestName', guestInfo.name);
                formData.append('guestPhone', guestInfo.phone);
            }

            const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000'}/message/voice-message`, {
                method: 'POST',
                body: formData
            });

            if (response.ok) {
                const data = await response.json();
                setAudioBlob(null);
                setAudioUrl('');
                URL.revokeObjectURL(audioUrl);
                
                // Ajouter le message audio à la liste des messages
                setMessages(prev => [...prev, data]);
            } else {
                throw new Error('Échec de l\'envoi du message vocal');
            }
        } catch (error) {
            console.error('Erreur lors de l\'envoi du message vocal:', error);
            
            // Check if it's a connection error
            if (error instanceof TypeError && error.message.includes('Failed to fetch')) {
                alert('Le serveur n\'est pas disponible. Veuillez vérifier que le serveur backend est démarré sur le port 3000.');
            } else {
            alert('Impossible d\'envoyer le message vocal');
            }
        } finally {
            setIsSending(false);
        }
    };

    // Fonctions pour les pièces jointes
    const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (file) {
            // Vérifier la taille du fichier (max 10MB)
            if (file.size > 10 * 1024 * 1024) {
                alert('Le fichier est trop volumineux. Taille maximale: 10MB');
                return;
            }

            // Vérifier le type de fichier
            const allowedTypes = [
                'image/jpeg', 'image/png', 'image/gif', 'image/webp',
                'application/pdf', 'text/plain', 'application/msword',
                'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
            ];

            if (!allowedTypes.includes(file.type)) {
                alert('Type de fichier non supporté. Formats acceptés: Images (JPG, PNG, GIF, WebP), PDF, TXT, DOC, DOCX');
                return;
            }

            setSelectedFile(file);
            
            // Créer une prévisualisation pour les images
            if (file.type.startsWith('image/')) {
                const reader = new FileReader();
                reader.onload = (e) => {
                    setFilePreview(e.target?.result as string);
                };
                reader.readAsDataURL(file);
            } else {
                setFilePreview('');
            }
        }
    };

    const removeSelectedFile = () => {
        setSelectedFile(null);
        setFilePreview('');
        if (fileInputRef.current) {
            fileInputRef.current.value = '';
        }
    };

    const sendAttachment = async () => {
        if (!selectedFile || !adminChat) {
            return;
        }

        setIsUploading(true);
        
        // Create temporary message for immediate display
        const isAuthenticated = auth?.user?._id && auth?.tokens?.accessToken;
        const isGuestChat = (adminChat as any)?.isGuestChat;
        const tempMessageId = `temp-attachment-${Date.now()}-${Math.random()}`;
        
        // Create a blob URL for preview
        const previewUrl = URL.createObjectURL(selectedFile);
        
        const tempAttachmentInfo = {
            _id: tempMessageId,
            url: previewUrl, // Use blob URL for preview
            name: selectedFile.name,
            type: selectedFile.type,
            size: selectedFile.size,
            filename: selectedFile.name,
            _previewUrl: previewUrl // Store for cleanup later
        };
        
        const tempMessage: Message = {
            _id: tempMessageId,
            message: `📎 ${selectedFile.name}`,
            sender: isAuthenticated ? (auth?.user?._id || 'user') : 'guest',
            reciver: 'admin',
            idChat: adminChat?._id || '',
            createdAt: new Date().toISOString(),
            isTemp: true,
            status: 'sending',
            attachment: tempAttachmentInfo
        };
        
        // Add temporary message immediately to local state
        setMessages(prev => [...prev, tempMessage]);
        console.log('✅ Temporary attachment message added to local state with preview:', tempAttachmentInfo);
        
        // Scroll to bottom to show the new message
        setTimeout(() => {
            scrollToBottom();
            forceScrollToBottom();
        }, 10);
        
        try {
            // Step 1: Upload the file to the attachments endpoint
            const uploadFormData = new FormData();
            uploadFormData.append('file', selectedFile);
            uploadFormData.append('as', 'message-attachment');
            
            console.log('📤 Uploading file to attachments endpoint...');
            const uploadResponse = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000'}/attachments/upload`, {
                method: 'POST',
                body: uploadFormData
            });

            if (!uploadResponse.ok) {
                const errorText = await uploadResponse.text();
                console.error('❌ Upload failed:', errorText);
                throw new Error('Échec du téléversement de la pièce jointe');
            }

            const uploadData = await uploadResponse.json();
            console.log('✅ File uploaded:', uploadData);
            
            // Extract attachment data - handle different response structures
            const attachmentInfo = {
                _id: uploadData._id || uploadData.id,
                url: uploadData.fullUrl || uploadData.url || `http://localhost:3000/static/${uploadData.filename}`,
                name: uploadData.originalname || selectedFile.name,
                type: uploadData.mimetype || selectedFile.type,
                size: uploadData.size || selectedFile.size,
                filename: uploadData.filename
            };
            
            console.log('📎 Attachment info:', attachmentInfo);
            
            // Step 2: Create a message with the attachment reference using unified approach
            const isGuestChat = (adminChat as any)?.isGuestChat;
            
            let messageData: any;
            if (isGuestChat || !isAuthenticated) {
                // Guest user message data - include attachment in message
                messageData = {
                    message: `📎 ${selectedFile.name}`,
                    guestName: guestInfo.name,
                    guestPhone: guestInfo.phone,
                    idChat: adminChat._id === 'pending-server-creation' ? '' : (adminChat._id || ''),
                    attachment: attachmentInfo // Add attachment directly to message
                };
            } else {
                // Authenticated user message data - include attachment in message
                messageData = {
                    message: `📎 ${selectedFile.name}`,
                    sender: auth?.user?._id || '',
                    reciver: 'admin',
                    idChat: adminChat._id || '',
                    attachment: attachmentInfo // Add attachment directly to message
                };
            }

            console.log('📤 Sending attachment message via unified API:', { messageData, isGuest: isGuestChat || !isAuthenticated });
            const sentMessage = await MessageAPI.sendMessage(messageData, isGuestChat || !isAuthenticated);
            
            // Extract the full message response with attachment
            const messageResponse = sentMessage?.data || sentMessage;
            
            // Ensure attachment is part of the message
            if (messageResponse) {
                messageResponse.attachment = attachmentInfo;
            }

            // Clear the file selection
            setSelectedFile(null);
            setFilePreview('');
            removeSelectedFile();
            
            // Replace temporary message with server response
            if (messageResponse) {
                setMessages(prev => prev.map(msg => {
                    if ((msg as any).isTemp && msg._id === tempMessageId) {
                        // Clean up blob URL from preview
                        if ((msg as any).attachment?._previewUrl) {
                            URL.revokeObjectURL((msg as any).attachment._previewUrl);
                            console.log('🧹 Cleaned up temporary blob URL');
                        }
                        return { 
                            ...messageResponse, 
                            createdAt: messageResponse.createdAt || new Date().toISOString(),
                            status: 'sent' as const,
                            isTemp: false,
                            attachment: attachmentInfo // Use server attachment data
                        };
                    }
                    return msg;
                }));
                console.log('✅ Temporary attachment message replaced with server response');
            }
        } catch (error) {
            console.error('Erreur lors de l\'envoi de la pièce jointe:', error);
            
            // Replace temporary message with error message
            const errorMessage: Message = {
                _id: tempMessageId,
                message: 'Failed to send attachment. Please try again.',
                sender: isAuthenticated ? (auth?.user?._id || 'user') : 'guest',
                reciver: 'admin',
                idChat: adminChat?._id || '',
                createdAt: new Date().toISOString(),
                isError: true
            };
            
            // Replace the temporary message with error message
            setMessages(prev => prev.map(msg => 
                (msg as any).isTemp && msg._id === tempMessageId
                    ? errorMessage
                    : msg
            ));
            
            // Check if it's a connection error
            if (error instanceof TypeError && error.message.includes('Failed to fetch')) {
                alert('Le serveur n\'est pas disponible. Veuillez vérifier que le serveur backend est démarré sur le port 3000.');
            } else {
                alert('Impossible d\'envoyer la pièce jointe. Veuillez réessayer.');
            }
            
            // Remove error message after 5 seconds
            setTimeout(() => {
                setMessages(prev => prev.filter(msg => !(msg as any).isError || msg._id !== tempMessageId));
            }, 5000);
            
            console.log('❌ Attachment error message displayed to user');
        } finally {
            setIsUploading(false);
        }
    };

    const getFileIcon = (fileType: string | undefined) => {
        if (!fileType) return 'bi bi-file';
        if (fileType.startsWith('image/')) return 'bi bi-image';
        if (fileType === 'application/pdf') return 'bi bi-file-pdf';
        if (fileType.includes('word')) return 'bi bi-file-word';
        if (fileType === 'text/plain') return 'bi bi-file-text';
        return 'bi bi-file';
    };

    const formatFileSize = (bytes: number) => {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    };

    // Save guest info to localStorage
    useEffect(() => {
        if (guestInfo.name || guestInfo.phone) {
            localStorage.setItem('guestChatInfo', JSON.stringify(guestInfo));
        }
    }, [guestInfo]);

    // Save guest chat ID to localStorage
    useEffect(() => {
        if (guestChatId) {
            localStorage.setItem('guestChatId', guestChatId);
        }
    }, [guestChatId]);

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
        if (!message.trim() || isSending) {
            return;
        }

        // Check if this is a guest chat
        const isGuestChat = (adminChat as any)?.isGuestChat;
        const isAuthenticated = auth?.user?._id && auth?.tokens?.accessToken;

        if (!isAuthenticated && !isGuestChat) {
            console.log('FloatingAdminChat: User not authenticated and not in guest chat, cannot send message');
            return;
        }

        console.log('📤 Sending message:', message.trim());
        console.log('📤 Current user:', isAuthenticated ? (auth?.user?._id || 'unknown') : 'guest');
        console.log('📤 Current chat:', adminChat);
        console.log('📤 Is guest chat:', isGuestChat);

        setIsSending(true);
        let currentChat = adminChat;

        // Create chat if it doesn't exist (for authenticated users)
        if (!currentChat && isAuthenticated) {
            console.log('📤 Creating new admin chat');
            currentChat = await createAdminChat();
            if (!currentChat) {
                console.error('❌ Failed to create admin chat');
                setIsSending(false);
                return;
            }
        }

        // For guest users, check if we have a guest chat (even without ID)
        if (!currentChat && !isAuthenticated) {
            console.error('❌ No guest chat available');
            setIsSending(false);
            return;
        }
        
        // For guest chats without ID, we'll let the server create the chat
        if (isGuestChat && !currentChat?._id) {
            console.log('🔍 Guest chat has no ID yet - server will create one');
        }

        // Create a temporary message for immediate display
        const tempMessage: Message = {
            _id: `temp-${Date.now()}-${Math.random()}`,
            message: message.trim(),
            sender: isAuthenticated ? (auth?.user?._id || 'guest') : 'guest',
            reciver: 'admin',
            idChat: currentChat?._id || '',
            createdAt: new Date().toISOString(),
            isTemp: true, // Flag to identify temporary messages
            status: 'sending' // Initial status
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
            // Use unified message sending approach
            const isAuthenticated = auth?.user?._id && auth?.tokens?.accessToken;
                
            let messageData: any;
            if (isGuestChat) {
                // Guest user message data
                messageData = {
                    message: message.trim(),
                    guestName: guestInfo.name,
                    guestPhone: guestInfo.phone,
                    idChat: currentChat?._id === 'pending-server-creation' ? '' : (currentChat?._id || '')
                };
            } else {
                // Authenticated user message data
                messageData = {
                    message: message.trim(),
                    sender: auth?.user?._id || '',
                    reciver: 'admin',
                    idChat: currentChat?._id || ''
                };
            }

            console.log('📤 Sending message via unified API:', { messageData, isGuest: isGuestChat });
            const sentMessage = await MessageAPI.sendMessage(messageData, isGuestChat);
            console.log('✅ Message sent successfully:', sentMessage);
                console.log('🔍 Sent message details:', {
                    messageId: (sentMessage as any)?._id,
                    chatId: (sentMessage as any)?.idChat,
                    sender: (sentMessage as any)?.sender,
                    receiver: (sentMessage as any)?.reciver,
                    message: (sentMessage as any)?.message,
                    fullResponse: sentMessage
                });

            // Handle the response from unified message sending
            const messageResponse = sentMessage?.data || sentMessage;
            
            if (messageResponse && messageResponse._id) {
                    // CRITICAL: Update the chat ID if it changed (server creates real chat ID)
                const newChatId = messageResponse.idChat;
                    console.log('🔍 Server returned chat ID:', newChatId);
                    console.log('🔍 Current local chat ID:', currentChat?._id);
                    
                    if (newChatId && (newChatId !== currentChat?._id || currentChat?._id === 'pending-server-creation')) {
                        console.log('🔄 CRITICAL: Chat ID mismatch detected!');
                        console.log('🔄 Local ID:', currentChat?._id);
                        console.log('🔄 Server ID:', newChatId);
                        console.log('🔄 Updating to server chat ID...');
                        
                        // Create updated chat object with real server chat ID
                        const updatedChat = {
                            ...currentChat,
                            _id: newChatId,
                            users: currentChat?.users || [
                                {
                                _id: isGuestChat ? 'guest' : (auth?.user?._id || 'user'),
                                firstName: isGuestChat ? (guestInfo.name || 'Guest') : (auth?.user?.firstName || 'User'),
                                lastName: isGuestChat ? 'User' : (auth?.user?.lastName || ''),
                                AccountType: isGuestChat ? 'guest' : (auth?.user?.type || 'user'),
                                phone: isGuestChat ? (guestInfo.phone || '') : (auth?.user?.phone || '')
                                },
                                {
                                    _id: 'admin',
                                    firstName: 'Admin',
                                    lastName: 'Support',
                                    AccountType: 'admin',
                                    phone: ''
                                }
                            ],
                            createdAt: currentChat?.createdAt || new Date().toISOString(),
                        isGuestChat: isGuestChat
                        };
                        
                        // Update state with real chat ID
                        setAdminChat(updatedChat);
                    if (isGuestChat) {
                        setGuestChatId(newChatId); // Save the real chat ID for persistence
                        
                        // CRITICAL: Immediately save to localStorage to ensure persistence
                        localStorage.setItem('guestChatId', newChatId);
                        localStorage.setItem('guestChatInfo', JSON.stringify(guestInfo));
                        console.log('✅ Chat ID synchronized with server and saved to localStorage:', newChatId);
                    }
                        
                        // Load all messages with the correct chat ID
                        try {
                            console.log('📨 Loading all messages with correct chat ID...');
                        const response = await MessageAPI.getByConversation(newChatId, {}, isGuestChat);
                        
                        let messagesToSet: Message[] = [];
                        // Handle different response structures
                        if (response && response.success && response.data) {
                            messagesToSet = response.data;
                        } else if (response && Array.isArray(response)) {
                            messagesToSet = response;
                        } else if (response && response.data) {
                            messagesToSet = Array.isArray(response.data) ? response.data : [];
                        }
                        
                        if (messagesToSet.length > 0) {
                            setMessages(messagesToSet);
                            saveMessagesToLocalStorage(messagesToSet, newChatId);
                            console.log('📨 All messages loaded:', messagesToSet.length);
                        } else {
                            console.log('⚠️ No messages returned from database');
                        }
                        } catch (error) {
                            console.error('❌ Error loading messages with correct chat ID:', error);
                        }
                    } else {
                        // Chat ID is the same, just replace the temporary message
                setMessages(prev => prev.map(msg =>
                    (msg as any).isTemp && msg.message === message.trim() ?
                                { 
                                ...messageResponse, 
                                createdAt: messageResponse.createdAt || new Date().toISOString(),
                                guestName: isGuestChat ? guestInfo.name : undefined,
                                guestPhone: isGuestChat ? guestInfo.phone : undefined,
                                isGuestMessage: isGuestChat,
                                    status: 'sent' as const, // Update status to sent
                                    isTemp: false // Remove temp flag
                                } :
                                msg
                ));
                    console.log('✅ Temporary message replaced with server message');
                    }
                } else {
                    console.log('❌ No valid response from server');
                // Fallback: refresh all messages if no response
                try {
                    const updatedMessagesResponse = await MessageAPI.getByConversation(currentChat?._id || '', {}, isGuestChat);
                const updatedMessages = updatedMessagesResponse?.success ? updatedMessagesResponse.data : [];
                setMessages(updatedMessages as Message[]);
                console.log('✅ Messages refreshed from server');
                } catch (error) {
                    console.error('❌ Error refreshing messages:', error);
            }
            }

            setMessage('');
        } catch (error) {
            console.error('❌ Error sending message:', error);

            // Show error message to user
            const errorMessage = {
                _id: `error-${Date.now()}`,
                message: isGuestChat ? 'Message saved locally. Our support team will see it when they check guest messages.' : 'Failed to send message. Please try again.',
                sender: 'system',
                reciver: isAuthenticated ? (auth?.user?._id || 'guest') : 'guest',
                idChat: currentChat?._id || '',
                createdAt: new Date().toISOString(),
                isError: true
            };

            // Replace temporary message with error message
        setMessages((prev: Message[]) => prev.map(msg =>
                (msg as any).isTemp && msg.message === message.trim() ?
                    errorMessage : msg
            ));

            // Remove error message after 5 seconds
            setTimeout(() => {
                setMessages((prev: Message[]) => prev.filter(msg => !(msg as any).isError));
            }, 5000);

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
            console.log(`📨 Current adminChat state:`, adminChat);
            console.log(`📨 Current auth state:`, { 
                hasUser: !!auth?.user?._id, 
                userId: auth?.user?._id,
                isGuest: !auth?.user?._id 
            });
            console.log(`📨 Message details:`, {
                messageId: data._id,
                messageText: data.message,
                sender: data.sender,
                receiver: data.reciver || data.receiverId,
                chatId: data.idChat || data.chatId,
                createdAt: data.createdAt,
                hasAttachment: !!data.attachment,
                attachment: data.attachment,
                fullMessageData: data
            });

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
            // For guest chats, we need to be more flexible with chat ID matching
            const isForCurrentChat = adminChat?._id && adminChat._id !== 'pending-server-creation' ? 
                (data.idChat === adminChat._id || data.chatId === adminChat._id) :
                (data.sender === 'admin' && data.reciver === 'guest'); // If no chat ID yet or placeholder, match by sender/receiver
            const isFromAdmin = data.sender === 'admin' || data.senderId === 'admin';
            
            // For authenticated users, check if message is for them
            // For guest users, check if message is for 'guest' receiver
            const isForCurrentUser = auth?.user?._id ? 
                (data.reciver === auth.user._id || data.receiverId === auth.user._id) :
                (data.reciver === 'guest' || data.receiverId === 'guest');

            console.log('🔍 Message analysis:', {
                eventType,
                isForCurrentChat,
                isFromAdmin,
                isForCurrentUser,
                chatId: data.idChat || data.chatId,
                currentChatId: adminChat._id,
                sender: data.sender,
                receiver: data.reciver || data.receiverId,
                currentUserId: auth?.user?._id,
                isGuestUser: !auth?.user?._id
            });

            // For adminMessage events, we only want admin messages for the current user/guest
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
                    // Ensure attachment is preserved if present
                    const messageToAdd = {
                        ...data,
                        attachment: data.attachment ? {
                            ...data.attachment,
                            // Ensure URL is absolute
                            url: data.attachment.url && data.attachment.url.startsWith('/static/') 
                                ? `http://localhost:3000${data.attachment.url}`
                                : data.attachment.url
                        } : undefined
                    };
                    
                    // Check if this is the user's own message and needs to replace a temp message
                    const isGuestChatCheck = (adminChat as any)?.isGuestChat;
                    if (data.sender === auth?.user?._id || (isGuestChatCheck && data.sender === 'guest')) {
                        // For attachment messages, check if message content matches (contains attachment filename)
                        const hasAttachment = data.attachment || data.message?.includes('📎');
                        const isAttachmentMessage = hasAttachment;
                        
                        if (isAttachmentMessage) {
                            // For attachments, match by attachment name or by message content containing the filename
                            const filtered = prev.filter(msg => {
                                // Don't filter out if it's a temp attachment message matching this one
                                const msgAttachment = (msg as any).attachment;
                                const matchesAttachment = msgAttachment && data.attachment && 
                                    (msgAttachment.name === data.attachment.name || 
                                     msgAttachment.filename === data.attachment.filename);
                                const matchesMessage = msg.message === data.message;
                                
                                // Keep message if it's not a temp matching this one
                                return !((msg as any).isTemp && (matchesAttachment || matchesMessage));
                            });
                            console.log(`✅ Attachment message updated in chat (replaced temp) from ${eventType}`);
                            return [...filtered, messageToAdd];
                        } else {
                            // For regular messages, filter by message content
                            const filtered = prev.filter(msg => !(msg as any).isTemp || msg.message !== data.message);
                            console.log(`✅ User message updated in chat (replaced temp) from ${eventType}`);
                            return [...filtered, messageToAdd];
                        }
                    } else {
                        console.log(`✅ ${eventType} message added to chat`);
                        return [...prev, messageToAdd];
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

        // Listen for admin messages from multiple events to ensure we catch all messages
        const handleAdminMessage = (data: any) => handleIncomingMessage(data, 'adminMessage');
        const handleSendMessage = (data: any) => handleIncomingMessage(data, 'sendMessage');
        const handleNewMessage = (data: any) => handleIncomingMessage(data, 'newMessage');

        // Set up event listeners for all message events
        if (socketContext?.socket) {
        socketContext.socket.on('adminMessage', handleAdminMessage);
            socketContext.socket.on('sendMessage', handleSendMessage);
            socketContext.socket.on('newMessage', handleNewMessage);
        }

        return () => {
            console.log('🔌 Cleaning up real-time message listeners');
            socketContext.socket?.off('adminMessage', handleAdminMessage);
            socketContext.socket?.off('sendMessage', handleSendMessage);
            socketContext.socket?.off('newMessage', handleNewMessage);
        };
    }, [socketContext?.socket, adminChat?._id, auth?.user?._id]); // Removed 'messages' dependency

    // Debug socket connection and events
    useEffect(() => {
        if (socketContext?.socket) {
            console.log('🔌 Socket connection status:', {
                connected: socketContext.socket.connected,
                id: socketContext.socket.id,
                adminChatId: adminChat?._id,
                isGuest: !auth?.user?._id
            });

            // Test socket events
            const testSocketEvents = () => {
                console.log('🧪 Testing socket events...');
                socketContext?.socket?.emit('test', { message: 'test from FloatingAdminChat' });
            };

            // Test after a delay to ensure socket is ready
            const timeoutId = setTimeout(testSocketEvents, 1000);
            return () => clearTimeout(timeoutId);
        }
    }, [socketContext?.socket, adminChat?._id, auth?.user?._id]);

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

    // Reset unread count when opening chat (but don't clear messages - they should persist)
    useEffect(() => {
        if (isOpen) {
            console.log('🔔 Chat opened, clearing notifications and loading messages');
            console.log('🔍 Current adminChat:', adminChat);
            console.log('🔍 Current adminChat._id:', adminChat?._id);
            console.log('🔍 Current guestChatId:', guestChatId);
            console.log('🔍 Current messages count:', messages.length);
            
            setUnreadCount(0);
            clearSocketMessages();

            // CRITICAL FIX: Don't load messages if we already have them (from button click handler)
            if (messages.length > 0) {
                console.log('✅ Messages already loaded, skipping database fetch to prevent clearing');
                return;
            }

            // Load messages from database
            const loadMessages = async () => {
                try {
                    // CRITICAL FIX: Load guest chat ID from localStorage for guest chats
                    let chatId = (adminChat as any)?.isGuestChat ? guestChatId : adminChat?._id;
                    
                    // For guest chats, also check localStorage
                    if ((adminChat as any)?.isGuestChat) {
                        const savedGuestChatId = localStorage.getItem('guestChatId');
                        if (savedGuestChatId) {
                            chatId = savedGuestChatId;
                            console.log('📱 Using saved guestChatId from localStorage:', savedGuestChatId);
                        }
                    }
                    
                    // First, try to load from localStorage for instant display
                    if (chatId) {
                        const cachedMessages = loadMessagesFromLocalStorage(chatId);
                        if (cachedMessages.length > 0) {
                            console.log('📂 Displaying cached messages from localStorage:', cachedMessages.length);
                            setMessages(cachedMessages);
                        }
                    }
                    
                    // For guest chats, try multiple strategies to find messages from server
                    if ((adminChat as any)?.isGuestChat) {
                        console.log('🔍 Guest chat detected, searching for messages...');
                        
                        // Strategy 1: Use stored guestChatId if available
                        if (guestChatId) {
                            console.log('📨 Trying stored guestChatId:', guestChatId);
                            try {
                                const response = await MessageAPI.getByConversation(guestChatId, {}, true);
                                if (response.data && response.data.length > 0) {
                                    console.log('✅ Found messages with stored guestChatId:', response.data.length);
                                    console.log('📎 Messages with attachments:', response.data.filter(msg => msg.attachment).length);
                                    response.data.forEach(msg => {
                                        if (msg.attachment) {
                                            console.log('📎 Attachment data:', msg.attachment);
                                        }
                                    });
                                    setMessages(response.data);
                                    saveMessagesToLocalStorage(response.data, guestChatId);
                                    return;
                                }
                                // If no messages from server, keep the cached ones
                                console.log('⚠️ No messages from server, keeping cached messages');
                            } catch (error) {
                                console.log('❌ No messages found with stored guestChatId, keeping cached ones');
                            }
                        }
                        
                        // Strategy 2: Try to find guest chat by guest info
                        if (guestInfo.name && guestInfo.phone) {
                            console.log('🔍 Searching for guest chat by info:', { name: guestInfo.name, phone: guestInfo.phone });
                            try {
                                const guestChatResponse = await ChatAPI.findGuestChat(guestInfo.name, guestInfo.phone);
                                if (guestChatResponse.success && guestChatResponse.data && guestChatResponse.data._id) {
                                    console.log('✅ Found guest chat by info:', guestChatResponse.data._id);
                                    
                                    // Update the chat ID to the found one
                                    const updatedChat = {
                                        ...adminChat,
                                        _id: guestChatResponse.data._id,
                                        users: guestChatResponse.data.users || [],
                                        createdAt: guestChatResponse.data.createdAt || new Date().toISOString(),
                                        isGuestChat: true
                                    };
                                    setAdminChat(updatedChat);
                                    setGuestChatId(guestChatResponse.data._id);
                                    
                                    // Load messages for this chat
                                    const response = await MessageAPI.getByConversation(guestChatResponse.data._id, {}, true);
                                    const messagesToSet = response.data || [];
                                    setMessages(messagesToSet);
                                    saveMessagesToLocalStorage(messagesToSet, guestChatResponse.data._id);
                                    console.log('✅ Guest chat found and messages loaded:', messagesToSet.length);
                                    return;
                                }
                            } catch (error) {
                                console.log('❌ Error finding guest chat by info:', error);
                            }
                        }
                        
                        // Strategy 3: Try stored chat IDs (skip placeholder ID)
                        const possibleChatIds = [
                            adminChat?._id !== 'pending-server-creation' ? adminChat?._id : null,
                            guestChatId
                        ].filter(Boolean);
                        
                        for (const chatId of possibleChatIds) {
                            if (!chatId) continue;
                            try {
                                console.log(`🔍 Checking chat ID: ${chatId}`);
                                const testResponse = await MessageAPI.getByConversation(chatId, {}, true);
                                if (testResponse.data && testResponse.data.length > 0) {
                                    console.log(`✅ Found ${testResponse.data.length} messages in chat ${chatId}`);
                                    
                                    // Update the chat ID to the correct one
                                    const updatedChat = {
                                        ...adminChat,
                                        _id: chatId,
                                        users: adminChat?.users || [],
                                        createdAt: adminChat?.createdAt || new Date().toISOString(),
                                        isGuestChat: true
                                    };
                                    setAdminChat(updatedChat);
                                    setGuestChatId(chatId);
                                    setMessages(testResponse.data);
                                    saveMessagesToLocalStorage(testResponse.data, chatId);
                                    
                                    console.log('✅ Chat ID automatically corrected to:', chatId);
                                    return;
                                }
                            } catch (error) {
                                console.log(`❌ No messages found for chat ${chatId}:`, (error as Error).message);
                            }
                        }
                        
                        console.log('❌ No messages found for guest chat');
                        // Don't clear messages if we have cached ones
                        if (chatId) {
                            const hasCached = loadMessagesFromLocalStorage(chatId).length > 0;
                            if (!hasCached) {
                                setMessages([]);
                            }
                        } else {
                            setMessages([]);
                        }
                    } else if (adminChat?._id) {
                        // Regular authenticated user flow
                        console.log('📨 Loading messages for authenticated chat:', adminChat._id);
                        const response = await MessageAPI.getByConversation(adminChat._id, {}, false);
                        const messagesToSet = response.data || [];
                        // Only set messages if we got data from server, otherwise keep cached
                        if (messagesToSet.length > 0) {
                            setMessages(messagesToSet);
                            saveMessagesToLocalStorage(messagesToSet, adminChat._id);
                            console.log('📨 Messages loaded:', messagesToSet.length);
                        } else {
                            console.log('⚠️ No messages from server, keeping cached ones');
                        }
                    } else {
                        console.log('❌ No chat ID available for message loading');
                        // Don't clear messages - keep what we have
                    }
                } catch (error) {
                    console.error('❌ Error loading messages:', error);
                    // Don't clear messages on error - keep what we have in cache
                    const chatId = (adminChat as any)?.isGuestChat ? guestChatId : adminChat?._id;
                    const cachedMessages = chatId ? loadMessagesFromLocalStorage(chatId) : [];
                    if (cachedMessages.length > 0) {
                        console.log('⚠️ Error loading from server, keeping cached messages');
                    } else {
                        setMessages([]);
                    }
                }
            };
            loadMessages();

            setTimeout(() => {
                refreshNotifications();
            }, 1000);
        }
    }, [isOpen, adminChat?._id, clearSocketMessages, refreshNotifications, messages.length]);

    // Reload messages when adminChat ID changes (for guest users)
    useEffect(() => {
        if (adminChat?._id && isOpen) {
            const loadMessages = async () => {
                try {
                    console.log('📨 Loading messages for chat ID:', adminChat._id);
                    const isGuest = !auth?.user?._id || !auth?.tokens?.accessToken;
                    const response = await MessageAPI.getByConversation(adminChat._id, {}, isGuest);
                    const messagesToSet = response.data || [];
                    setMessages(messagesToSet);
                    saveMessagesToLocalStorage(messagesToSet, adminChat._id);
                    console.log('📨 Messages loaded:', messagesToSet.length);
                } catch (error) {
                    console.error('❌ Error loading messages for chat:', error);
                }
            };
            loadMessages();
        }
    }, [adminChat?._id, isOpen]);

    // Debug: Log messages state changes
    useEffect(() => {
        console.log('📝 Messages state changed:', messages);
        console.log('📝 Number of messages:', messages.length);
    }, [messages]);

    // Save messages to localStorage whenever they change
    useEffect(() => {
        let chatId = (adminChat as any)?.isGuestChat ? guestChatId : adminChat?._id;
        
        // For guest chats, also check localStorage for the most up-to-date chat ID
        if ((adminChat as any)?.isGuestChat) {
            const savedGuestChatId = localStorage.getItem('guestChatId');
            if (savedGuestChatId) {
                chatId = savedGuestChatId;
            }
        }
        
        if (chatId && messages.length > 0) {
            // Filter out temporary messages before saving
            const messagesToSave = messages.filter(msg => !(msg as any).isTemp);
            saveMessagesToLocalStorage(messagesToSave, chatId);
        }
    }, [messages, adminChat?._id, guestChatId]);

    // Load guest info from localStorage on component mount
    useEffect(() => {
        const savedGuestInfo = localStorage.getItem('guestChatInfo');
        if (savedGuestInfo) {
            try {
                const parsedInfo = JSON.parse(savedGuestInfo);
                setGuestInfo(parsedInfo);
                console.log('📱 Loaded guest info from localStorage:', parsedInfo);
            } catch (error) {
                console.error('❌ Error parsing guest info from localStorage:', error);
            }
        }

        // Load messages from localStorage on mount if we have guestChatId
        const savedGuestChatId = localStorage.getItem('guestChatId');
        if (savedGuestChatId) {
            console.log('🔍 Found saved guestChatId on mount:', savedGuestChatId);
            const cachedMessages = loadMessagesFromLocalStorage(savedGuestChatId);
            if (cachedMessages.length > 0) {
                console.log('📂 Loading cached messages on mount:', cachedMessages.length);
                setMessages(cachedMessages);
                
                // Also try to restore the adminChat
                const savedGuestInfo = localStorage.getItem('guestChatInfo');
                if (savedGuestInfo) {
                    try {
                        const parsedInfo = JSON.parse(savedGuestInfo);
                        const guestChat: AdminChat = {
                            _id: savedGuestChatId,
                            users: [
                                { _id: 'guest', firstName: parsedInfo.name || 'Guest', lastName: '', AccountType: 'guest' },
                                { _id: 'admin', firstName: 'Admin', lastName: 'Support', AccountType: 'admin' }
                            ],
                            createdAt: new Date().toISOString()
                        };
                        setAdminChat(guestChat);
                        setGuestChatId(savedGuestChatId);
                        console.log('✅ Restored guest chat from localStorage');
                    } catch (error) {
                        console.error('❌ Error parsing guest chat info:', error);
                    }
                }
            }
        }
    }, []);

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

    // Helper functions for localStorage
    const saveMessagesToLocalStorage = (messagesToSave: Message[], chatId: string) => {
        try {
            const key = `chat_messages_${chatId}`;
            console.log('💾 Saving messages to localStorage:', {
                key,
                chatId,
                messageCount: messagesToSave.length,
                firstMessage: messagesToSave[0]
            });
            localStorage.setItem(key, JSON.stringify(messagesToSave));
            console.log('✅ Messages saved to localStorage successfully');
        } catch (error) {
            console.error('❌ Error saving messages to localStorage:', error);
        }
    };

    const loadMessagesFromLocalStorage = (chatId: string): Message[] => {
        try {
            const key = `chat_messages_${chatId}`;
            console.log('🔍 Trying to load from localStorage with key:', key);
            console.log('🔍 Chat ID being used:', chatId);
            
            // Debug: Log all localStorage keys
            const allKeys = Object.keys(localStorage);
            console.log('🔍 All localStorage keys:', allKeys);
            console.log('🔍 Chat message keys:', allKeys.filter(k => k.startsWith('chat_messages_')));
            
            const saved = localStorage.getItem(key);
            if (saved) {
                const messages = JSON.parse(saved);
                console.log('📂 Messages loaded from localStorage:', messages.length);
                console.log('📂 First message:', messages[0]);
                return messages;
            } else {
                console.log('⚠️ No data found in localStorage for key:', key);
            }
        } catch (error) {
            console.error('❌ Error loading messages from localStorage:', error);
        }
        return [];
    };

    const clearMessagesFromLocalStorage = (chatId: string) => {
        try {
            const key = `chat_messages_${chatId}`;
            localStorage.removeItem(key);
            console.log('🧹 Messages cleared from localStorage');
        } catch (error) {
            console.error('❌ Error clearing messages from localStorage:', error);
        }
    };

    const isOwnMessage = (senderId: string) => senderId === auth?.user?._id;

    // Handle guest form submission
    const handleGuestFormSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        
        if (!guestInfo.name.trim() || !guestInfo.phone.trim()) {
            alert('Please fill in both name and phone number');
            return;
        }

        // Update the guest chat with user info
        if (adminChat) {
            const updatedChat = {
                ...adminChat,
                users: adminChat.users.map(user => 
                    user._id === 'guest' 
                        ? { ...user, firstName: guestInfo.name.trim(), phone: guestInfo.phone.trim() }
                        : user
                )
            };
            setAdminChat(updatedChat);
        }

        // Add welcome message with user info
        const welcomeMessage = {
            _id: `welcome-${Date.now()}`,
            message: `Welcome ${guestInfo.name}! I'm here to help. Your phone number is ${guestInfo.phone}. Please note that as a guest user, your messages will be visible to our support team. For a better experience, consider creating an account.`,
            sender: 'admin',
            reciver: 'guest',
            idChat: adminChat?._id || '',
            createdAt: new Date().toISOString(),
            isSystemMessage: true
        };

        setMessages([welcomeMessage]);
        setShowGuestForm(false);
        
        // Store guest info in localStorage for persistence (use consistent key)
        localStorage.setItem('guestChatInfo', JSON.stringify(guestInfo));
        
        console.log('✅ Guest info submitted and saved:', guestInfo);
    };

    // Don't render the component at all on auth pages
    if (isOnAuthPage) {
        console.log('FloatingAdminChat: On auth page, not rendering component');
        return null;
    }

    console.log('🔍 FloatingAdminChat: Rendering component with auth state:', {
        hasAuth: !!auth,
        hasUser: !!auth?.user,
        hasUserId: !!auth?.user?._id,
        hasTokens: !!auth?.tokens,
        hasAccessToken: !!auth?.tokens?.accessToken,
        isOpen,
        isLoading
    });

    return (
        <>
            {/* Floating Action Button */}
            <div className={`floating-chat-button ${isOpen ? 'hidden' : ''}`}>
                <button
                    className="chat-fab"
                    onClick={async () => {
                        console.log('🔍 FloatingAdminChat: Button clicked');
                        console.log('🔍 Auth state:', {
                            hasAuth: !!auth,
                            hasUser: !!auth?.user,
                            hasUserId: !!auth?.user?._id,
                            hasTokens: !!auth?.tokens,
                            hasAccessToken: !!auth?.tokens?.accessToken,
                            isOnAuthPage
                        });

                        if (isOnAuthPage) {
                            console.log('❌ FloatingAdminChat: On auth page, cannot open chat');
                            return;
                        }

                        // Show chat dialog immediately for better UX
                        setIsOpen(true);
                        setIsLoading(true);

                        try {
                            // Check if user is authenticated
                            if (!auth?.user?._id || !auth?.tokens?.accessToken) {
                                console.log('🔍 User not authenticated, initializing guest chat');
                                
                                // CRITICAL FIX: Load guest chat ID and info from localStorage first
                                const savedGuestChatId = localStorage.getItem('guestChatId');
                                const savedGuestInfo = localStorage.getItem('guestChatInfo');
                                
                                let currentGuestChatId = savedGuestChatId || guestChatId;
                                let currentGuestInfo = guestInfo;
                                
                                // Load guest info from localStorage if available
                                if (savedGuestInfo) {
                                    try {
                                        currentGuestInfo = JSON.parse(savedGuestInfo);
                                        console.log('📱 Loaded guest info from localStorage:', currentGuestInfo);
                                    } catch (error) {
                                        console.error('❌ Error parsing guest info from localStorage:', error);
                                    }
                                }
                                
                                console.log('🔍 Checking for guest chat ID:', { 
                                    savedGuestChatId, 
                                    currentGuestChatId, 
                                    guestChatId,
                                    savedGuestInfo,
                                    currentGuestInfo 
                                });
                                
                                // Check if we have a stored guest chat ID
                                if (currentGuestChatId) {
                                    console.log('🔍 Found existing guest chat ID:', currentGuestChatId);
                                    
                                    // Create guest chat with stored ID
                                const guestChat = {
                                        _id: currentGuestChatId,
                                    users: [
                                        {
                                            _id: 'guest',
                                                firstName: currentGuestInfo.name || 'Guest',
                                            lastName: 'User',
                                            AccountType: 'guest',
                                                phone: currentGuestInfo.phone || ''
                                            },
                                            {
                                                _id: 'admin',
                                                firstName: 'Admin',
                                                lastName: 'Support',
                                                AccountType: 'admin',
                                            phone: ''
                                            }
                                        ],
                                        createdAt: new Date().toISOString(),
                                        isGuestChat: true
                                    };
                                    
                                    console.log('🔍 Restored guest chat:', guestChat);
                                    setAdminChat(guestChat as AdminChat);
                                    setGuestChatId(currentGuestChatId);
                                    setGuestInfo(currentGuestInfo);
                                    
                                    // CRITICAL FIX: Load from localStorage FIRST for immediate display
                                    console.log('📂 Loading messages from localStorage first for immediate display');
                                    const cachedMessages = loadMessagesFromLocalStorage(currentGuestChatId);
                                    if (cachedMessages.length > 0) {
                                        console.log('✅ Displaying', cachedMessages.length, 'cached messages immediately');
                                        setMessages(cachedMessages);
                                    }
                                    
                                    // Then fetch from database in background for updates
                                    try {
                                        console.log('📥 Fetching messages from database for chat:', currentGuestChatId);
                                        const response = await MessageAPI.getByConversation(currentGuestChatId);
                                        console.log('📥 Response from database:', response);
                                        
                                        let messagesToSet: Message[] = [];
                                        
                                        // Handle different response structures
                                        if (response && response.success && response.data) {
                                            messagesToSet = response.data;
                                        } else if (response && Array.isArray(response)) {
                                            messagesToSet = response;
                                        } else if (response && response.data) {
                                            messagesToSet = Array.isArray(response.data) ? response.data : [];
                                        }
                                        
                                        console.log('📥 Parsed messages from database:', messagesToSet.length);
                                        
                                        // Only update if we got messages from database AND they're different from cached
                                        if (messagesToSet.length > 0) {
                                            // Check if database messages are different from cached
                                            const isDifferent = messagesToSet.length !== cachedMessages.length || 
                                                messagesToSet.some((dbMsg, index) => 
                                                    !cachedMessages[index] || dbMsg._id !== cachedMessages[index]._id
                                                );
                                            
                                            if (isDifferent) {
                                                console.log('🔄 Database has different messages, updating display');
                                        setMessages(messagesToSet);
                                                saveMessagesToLocalStorage(messagesToSet, currentGuestChatId);
                                            } else {
                                                console.log('✅ Database messages same as cached, keeping cached display');
                                            }
                                        } else {
                                            console.log('⚠️ No messages found in database, keeping cached messages');
                                        }
                                    } catch (error) {
                                        console.error('❌ Error loading messages from database:', error);
                                        console.log('✅ Keeping cached messages on database error');
                                        // Don't clear messages - keep what we loaded from cache
                                    }
                                    
                                    setShowGuestForm(false); // Don't show form if we have existing chat
                                    setIsLoading(false);
                                    return;
                                } else {
                                    console.log('🔍 No existing guest chat, will create on first message');
                                    
                                    // Load guest info from localStorage if available
                                    let currentGuestInfo = guestInfo;
                                    const savedGuestInfo = localStorage.getItem('guestChatInfo');
                                    if (savedGuestInfo) {
                                        try {
                                            currentGuestInfo = JSON.parse(savedGuestInfo);
                                            console.log('📱 Loaded guest info from localStorage for new chat:', currentGuestInfo);
                                        } catch (error) {
                                            console.error('❌ Error parsing guest info from localStorage:', error);
                                        }
                                    }
                                    
                                    setGuestInfo(currentGuestInfo);
                                    
                                    // Don't create a temporary chat ID - let the server create the real one
                                    // Just set up the guest chat structure without an ID
                                    const guestChat = {
                                        _id: 'pending-server-creation', // Placeholder ID - will be set by server on first message
                                        users: [
                                            {
                                                _id: 'guest',
                                                firstName: currentGuestInfo.name || 'Guest',
                                                lastName: 'User',
                                                AccountType: 'guest',
                                                phone: currentGuestInfo.phone || ''
                                        },
                                        {
                                            _id: 'admin',
                                            firstName: 'Admin',
                                            lastName: 'Support',
                                            AccountType: 'admin',
                                            phone: ''
                                        }
                                    ],
                                    createdAt: new Date().toISOString(),
                                    isGuestChat: true
                                };
                                
                                    console.log('🔍 Prepared guest chat structure (no ID yet):', guestChat);
                                setAdminChat(guestChat as AdminChat);
                                    setMessages([]); // Start with empty messages
                                    setShowGuestForm(!(currentGuestInfo.name && currentGuestInfo.phone)); // Only show form if no guest info
                                setIsLoading(false);
                                return;
                                }
                            }

                            // Continue with authenticated user flow
                            console.log('🔍 Starting chat initialization for authenticated user:', auth.user._id);
                            
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
                    aria-label="Ouvrir le chat avec le support"
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
                                    <h4>Support Admin</h4>
                                    <div className="online-status">
                                        <span className="online-dot"></span>
                                        <span>En ligne</span>
                                    </div>
                                </div>
                            </div>

                            <button
                                className="close-chat-btn"
                                onClick={() => setIsOpen(false)}
                                aria-label="Fermer le chat"
                            >
                                <i className="bi bi-x"></i>
                            </button>
                        </div>

                        {/* Guest Form */}
                        {showGuestForm && (
                            <div className="guest-form-overlay">
                                <div className="guest-form">
                                    <div className="guest-form-header">
                                        <h4>Welcome to Support Chat</h4>
                                        <p>Please provide your information to start chatting</p>
                                    </div>
                                    <form onSubmit={handleGuestFormSubmit} className="guest-form-content">
                                        <div className="form-group">
                                            <label htmlFor="guestName">Your Name *</label>
                                            <input
                                                type="text"
                                                id="guestName"
                                                value={guestInfo.name}
                                                onChange={(e) => setGuestInfo((prev: any) => ({ ...prev, name: e.target.value }))}
                                                placeholder="Enter your full name"
                                                required
                                                className="form-input"
                                            />
                                        </div>
                                        <div className="form-group">
                                            <label htmlFor="guestPhone">Phone Number *</label>
                                            <input
                                                type="tel"
                                                id="guestPhone"
                                                value={guestInfo.phone}
                                                onChange={(e) => setGuestInfo((prev: any) => ({ ...prev, phone: e.target.value }))}
                                                placeholder="Enter your phone number"
                                                required
                                                className="form-input"
                                            />
                                        </div>
                                        <div className="form-actions">
                                            <button type="submit" className="submit-btn">
                                                Start Chatting
                                            </button>
                                        </div>
                                        <div className="form-footer">
                                            <small>
                                                <i className="bi bi-shield-check"></i>
                                                Your information is secure and will only be used for support purposes
                                            </small>
                                        </div>
                                    </form>
                                </div>
                            </div>
                        )}

                        {/* Messages Area */}
                        <div className="chat-content">
                            <div className="messages-area">
                                {isLoading ? (
                                    <div className="loading-messages">
                                        <div className="loading-spinner"></div>
                                        <p>Chargement des messages...</p>
                                    </div>
                                ) : messages.length === 0 ? (
                                    <div className="empty-chat">
                                        <i className="bi bi-chat-dots"></i>
                                        <p>Démarrez la conversation</p>
                                        <small>Nous sommes là pour vous aider</small>
                                        {(adminChat as any)?.isGuestChat && (
                                            <div className="guest-notice">
                                                <i className="bi bi-info-circle"></i>
                                                <p>You're chatting as a guest. Your messages will be visible to our support team.</p>
                                                <small>Consider creating an account for a better experience!</small>
                                            </div>
                                        )}
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
                                            const isGuestMessage = (msg as any).isGuestMessage;
                                            const isSystemMessage = (msg as any).isSystemMessage;
                                            const isGuestChat = (adminChat as any)?.isGuestChat;
                                            
                                            // Determine if this is the user's own message
                                            const isOwn = isGuestChat ? 
                                                (msg.sender === 'guest') : 
                                                isOwnMessage(msg.sender);

                                            return (
                                                <div
                                                    key={`${msg._id || 'msg'}-${index}-${Date.parse(msg.createdAt) || index}`}
                                                    className={`message ${isOwn ? 'own' : 'other'} ${isTemp ? 'temp-message' : ''} ${isSystem ? 'system-message' : ''} ${isSystemMessage ? 'system-message' : ''} ${isGuestMessage ? 'guest-message' : ''}`}
                                                >
                                                    <div
                                                        className="message-bubble"
                                                        data-error={isError ? "true" : "false"}
                                                        data-guest={isGuestMessage ? "true" : "false"}
                                                        data-system={isSystemMessage ? "true" : "false"}
                                                    >
                                                        {(msg as any).attachment && (msg as any).attachment.url && (msg as any).attachment.name ? (
                                                            <>
                                                                {console.log('📎 Rendering attachment:', (msg as any).attachment)}
                                                                {console.log('📎 Attachment URL:', (msg as any).attachment.url)}
                                                                {console.log('📎 Attachment type:', (msg as any).attachment.type)}
                                                                {console.log('📎 Attachment name:', (msg as any).attachment.name)}
                                                                {(msg as any).attachment.type?.startsWith('audio/') || (msg as any).attachment.name?.includes('voice') ? (
                                                                    (() => {
                                                                        const audioUrl = (msg as any).attachment.url && (msg as any).attachment.url.startsWith('/static/') 
                                                                            ? `http://localhost:3000${(msg as any).attachment.url}`
                                                                            : (msg as any).attachment.url;
                                                                        console.log('🎤 Voice message URL:', (msg as any).attachment.url);
                                                                        console.log('🎤 Voice message processed URL:', audioUrl);
                                                                        return (
                                                                            <div 
                                                                                style={{ 
                                                                                    display: 'flex',
                                                                                    alignItems: 'center',
                                                                                    gap: '12px',
                                                                                    padding: '12px',
                                                                                    background: 'rgba(0,0,0,0.05)',
                                                                                    borderRadius: '8px',
                                                                                    maxWidth: '300px'
                                                                                }}
                                                                            >
                                                                                <i 
                                                                                    className="bi bi-mic-fill" 
                                                                                    style={{ 
                                                                                        fontSize: '32px',
                                                                                        color: '#e91e63'
                                                                                    }}
                                                                                ></i>
                                                                                <div style={{ flex: 1, minWidth: 0 }}>
                                                                                    <div style={{ fontWeight: '600', fontSize: '14px', wordBreak: 'break-word' }}>
                                                                                        {(msg as any).attachment.name || 'Voice Message'}
                                                                                    </div>
                                                                                    <audio
                                                                                        controls
                                                                                        src={audioUrl}
                                                                                        style={{ 
                                                                                            width: '100%', 
                                                                                            height: '40px',
                                                                                            marginTop: '8px'
                                                                                        }}
                                                                                        onError={(e) => {
                                                                                            console.error('🎤 Audio load error:', e);
                                                                                            console.error('🎤 Failed URL:', audioUrl);
                                                                                        }}
                                                                                        onLoadStart={() => {
                                                                                            console.log('🎤 Audio loading started');
                                                                                        }}
                                                                                        onCanPlay={() => {
                                                                                            console.log('🎤 Audio can play');
                                                                                        }}
                                                                                    />
                                                                                </div>
                                                                            </div>
                                                                        );
                                                                    })()
                                                                ) : (msg as any).attachment.type?.startsWith('image/') ? (
                                                                    <div 
                                                                        style={{ 
                                                                            display: 'flex',
                                                                            alignItems: 'center',
                                                                            gap: '12px',
                                                                            padding: '12px',
                                                                            background: 'rgba(0,0,0,0.05)',
                                                                            borderRadius: '8px',
                                                                            cursor: 'pointer',
                                                                            maxWidth: '300px'
                                                                        }}
                                                                        onClick={() => {
                                                                            // Ensure we have an absolute URL for the modal
                                                                            let imageUrl = (msg as any).attachment.url;
                                                                            if (imageUrl && imageUrl.startsWith('/static/')) {
                                                                                imageUrl = `http://localhost:3000${imageUrl}`;
                                                                            }
                                                                            console.log('🖼️ Opening image modal with URL:', imageUrl);
                                                                            console.log('🖼️ Full attachment data:', (msg as any).attachment);
                                                                            
                                                                            // Test with a fallback image if the original fails
                                                                            setSelectedImage({ 
                                                                                url: imageUrl, 
                                                                                name: (msg as any).attachment.name || 'Image' 
                                                                            });
                                                                        }}
                                                                    >
                                                                        <i 
                                                                            className="bi bi-image" 
                                                                            style={{ 
                                                                                fontSize: '32px',
                                                                                color: '#3b82f6'
                                                                            }}
                                                                        ></i>
                                                                        <div style={{ flex: 1, minWidth: 0 }}>
                                                                            <div style={{ fontWeight: '600', fontSize: '14px', wordBreak: 'break-word' }}>
                                                                                {(msg as any).attachment.name || 'Image'}
                                                                            </div>
                                                                            <div style={{ fontSize: '12px', color: '#666', marginTop: '4px' }}>
                                                                                📷 {(msg as any).attachment.type?.split('/')[1]?.toUpperCase() || 'IMAGE'}
                                                                            </div>
                                                                        </div>
                                                                    </div>
                                                                ) : (
                                                                    <div className="attachment-file">
                                                                        <i className={getFileIcon((msg as any).attachment.type)}></i>
                                                                        <div className="attachment-info">
                                                                            <span className="attachment-name">{(msg as any).attachment.name}</span>
                                                                            <span className="attachment-size">{formatFileSize((msg as any).attachment.size)}</span>
                                                                        </div>
                                                                        <button 
                                                                            className="download-btn"
                                                                            onClick={() => {
                                                                                // Download file
                                                                                const link = document.createElement('a');
                                                                                link.href = (msg as any).attachment.url;
                                                                                link.download = (msg as any).attachment.name;
                                                                                link.click();
                                                                            }}
                                                                        >
                                                                            <i className="bi bi-download"></i>
                                                                        </button>
                                                                    </div>
                                                                )}
                                                                {msg.message && msg.message.trim() !== `📎 ${(msg as any).attachment.name}` && (
                                                                    <p style={{ marginTop: '8px' }}>{msg.message}</p>
                                                                )}
                                                            </>
                                                        ) : (
                                                            <p>{msg.message}</p>
                                                        )}
                                                        <div className="message-footer">
                                                            <span className="message-time">
                                                                {isTemp ? (
                                                                    <span className="sending-indicator">
                                                                        <i className="bi bi-clock"></i> Envoi...
                                                                    </span>
                                                                ) : isError ? (
                                                                    <span className="error-indicator">
                                                                        <i className="bi bi-exclamation-triangle"></i> Erreur
                                                                    </span>
                                                                ) : isSystemMessage ? (
                                                                    <span className="system-indicator">
                                                                        <i className="bi bi-info-circle"></i> Systeme
                                                                    </span>
                                                                ) : isGuestMessage ? (
                                                                    <span className="guest-indicator">
                                                                        <i className="bi bi-person"></i> Invité
                                                                    </span>
                                                                ) : (
                                                                    formatTime(msg.createdAt)
                                                                )}
                                                            </span>
                                                            {isOwn && !isTemp && !isError && msg.status && (
                                                                <span className="message-status">
                                                                    {msg.status === 'sent' ? (
                                                                        <span className="status-sent"><i className="bi bi-check"></i></span>
                                                                    ) : msg.status === 'delivered' ? (
                                                                        <span className="status-delivered"><i className="bi bi-check-double"></i></span>
                                                                    ) : msg.status === 'read' ? (
                                                                        <span className="status-read"><i className="bi bi-check-double"></i></span>
                                                                    ) : null}
                                                                </span>
                                                            )}
                                                        </div>
                                                    </div>
                                                </div>
                                            );
                                        })
                                )}

                                {isTyping && (
                                    <div className="message other">
                                        <div className="message-bubble typing">
                                            <p><em>Admin en train d'écrire...</em></p>
                                        </div>
                                    </div>
                                )}

                                <div ref={messagesEndRef} />
                            </div>

                            {/* Enhanced Message Input - This is where you can add new messages */}
                            {!showGuestForm && (
                                <div className="message-input-area">
                                <div className="input-container">
                                    <div className="input-wrapper">
                                        <textarea
                                            ref={textareaRef}
                                            value={message}
                                            onChange={handleInputChange}
                                            onKeyPress={handleKeyPress}
                                            placeholder="Écrivez votre message..."
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
                                                title="Ajouter un emoji"
                                                onClick={() => setShowEmojiPicker(!showEmojiPicker)}
                                            >
                                                <i className="bi bi-emoji-smile"></i>
                                            </button>
                                            <button
                                                type="button"
                                                className="attach-btn"
                                                title="Joindre un fichier"
                                                onClick={() => fileInputRef.current?.click()}
                                            >
                                                <i className="bi bi-paperclip"></i>
                                            </button>
                                            {!audioUrl ? (
                                                <button
                                                    type="button"
                                                    className={`voice-btn ${isRecording ? 'recording' : ''}`}
                                                    title="Message vocal"
                                                    onClick={() => {
                                                        if (isRecording) {
                                                            stopRecording();
                                                        } else {
                                                            startRecording();
                                                        }
                                                    }}
                                                >
                                                    <i className="bi bi-mic-fill"></i>
                                                </button>
                                            ) : (
                                                <div className="voice-preview">
                                                    <audio src={audioUrl} controls style={{ width: '200px', height: '40px' }} />
                                                    <button
                                                        type="button"
                                                        className="send-voice-btn"
                                                        onClick={sendVoiceMessage}
                                                        disabled={isSending}
                                                    >
                                                        <i className="bi bi-send-fill"></i>
                                                    </button>
                                                    <button
                                                        type="button"
                                                        className="cancel-voice-btn"
                                                        onClick={() => {
                                                            setAudioUrl('');
                                                            setAudioBlob(null);
                                                            if (audioUrl) URL.revokeObjectURL(audioUrl);
                                                        }}
                                                    >
                                                        <i className="bi bi-x-lg"></i>
                                                    </button>
                                                </div>
                                            )}
                                        </div>

                                        {/* Hidden file input */}
                                        <input
                                            ref={fileInputRef}
                                            type="file"
                                            accept="image/*,.pdf,.txt,.doc,.docx"
                                            onChange={handleFileSelect}
                                            style={{ display: 'none' }}
                                        />

                                        {/* File Preview */}
                                        {selectedFile && (
                                            <div className="file-preview">
                                                {filePreview ? (
                                                    <div className="image-preview">
                                                        <img src={filePreview} alt="Preview" />
                                                        <div className="file-info">
                                                            <span className="file-name">{selectedFile.name}</span>
                                                            <span className="file-size">{formatFileSize(selectedFile.size)}</span>
                                                        </div>
                                                    </div>
                                                ) : (
                                                    <div className="file-info">
                                                        <i className={getFileIcon(selectedFile.type)}></i>
                                                        <div className="file-details">
                                                            <span className="file-name">{selectedFile.name}</span>
                                                            <span className="file-size">{formatFileSize(selectedFile.size)}</span>
                                                        </div>
                                                    </div>
                                                )}
                                                <div className="file-actions">
                                                    <button
                                                        type="button"
                                                        className="send-file-btn"
                                                        onClick={sendAttachment}
                                                        disabled={isUploading}
                                                    >
                                                        {isUploading ? (
                                                            <div className="uploading-spinner"></div>
                                                        ) : (
                                                            <i className="bi bi-send-fill"></i>
                                                        )}
                                                    </button>
                                                    <button
                                                        type="button"
                                                        className="remove-file-btn"
                                                        onClick={removeSelectedFile}
                                                    >
                                                        <i className="bi bi-x-lg"></i>
                                                    </button>
                                                </div>
                                            </div>
                                        )}

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
                                                    <small>Emojis rapides</small>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                    <button
                                        onClick={sendMessage}
                                        disabled={!message.trim() || isSending}
                                        className={`send-btn ${isSending ? 'sending' : ''}`}
                                        aria-label="Envoyer le message"
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
                                        Appuyez sur Entrée pour envoyer
                                    </div>
                                    {showCharCount && (
                                        <div className={`char-count ${message.length > 1900 ? 'warning' : ''}`}>
                                            {message.length}/2000
                                        </div>
                                    )}
                                </div>
                                
                            </div>
                            )}
                        </div>
                    </div>
                </div>
            )}

            <style>{`
        .floating-chat-button {
          position: fixed;
          bottom: 32px;
          right: 32px;
          z-index: 1350;
          transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
        }

        .floating-chat-button.hidden {
          opacity: 0;
          pointer-events: none;
          transform: scale(0.8);
        }

        .chat-fab {
          width: 72px;
          height: 72px;
          border-radius: 50%;
          background: linear-gradient(135deg, #3b82f6 0%, #1e40af 100%);
          border: none;
          color: white;
          font-size: 28px;
          cursor: pointer;
          box-shadow: 0 12px 40px rgba(59, 130, 246, 0.4);
          transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
          position: relative;
          display: flex;
          align-items: center;
          justify-content: center;
          backdrop-filter: blur(10px);
          border: 2px solid rgba(255, 255, 255, 0.2);
        }

        .chat-fab:hover {
          transform: scale(1.1) translateY(-2px);
          box-shadow: 0 20px 60px rgba(59, 130, 246, 0.6);
          background: linear-gradient(135deg, #1e40af 0%, #3b82f6 100%);
        }

        .chat-fab:active {
          transform: scale(1.05) translateY(-1px);
        }

        .unread-badge {
          position: absolute;
          top: -6px;
          right: -6px;
          background: linear-gradient(135deg, #ff6b6b 0%, #ee5a52 100%);
          color: white;
          border-radius: 50%;
          min-width: 28px;
          height: 28px;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 13px;
          font-weight: 700;
          border: 3px solid white;
          box-shadow: 0 4px 12px rgba(255, 107, 107, 0.4);
          animation: bounce 2s infinite;
        }

        @keyframes bounce {
          0%, 20%, 50%, 80%, 100% {
            transform: translateY(0);
          }
          40% {
            transform: translateY(-4px);
          }
          60% {
            transform: translateY(-2px);
          }
        }

        .chat-dialog-overlay {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: rgba(0, 0, 0, 0.6);
          backdrop-filter: blur(8px);
          z-index: 1400;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 20px;
          animation: fadeIn 0.3s ease-out;
        }

        @keyframes fadeIn {
          from {
            opacity: 0;
            backdrop-filter: blur(0px);
          }
          to {
            opacity: 1;
            backdrop-filter: blur(8px);
          }
        }

        .chat-dialog {
          width: 480px;
          min-width: 380px;
          max-width: 90vw;
          height: 700px;
          min-height: 550px;
          max-height: 90vh;
          background: white;
          border-radius: 24px;
          overflow: hidden;
          box-shadow: 0 32px 80px rgba(0, 0, 0, 0.4);
          display: flex;
          flex-direction: column;
          position: relative;
          border: 1px solid rgba(255, 255, 255, 0.2);
          animation: slideUp 0.4s cubic-bezier(0.4, 0, 0.2, 1);
        }

        @keyframes slideUp {
          from {
            opacity: 0;
            transform: translateY(40px) scale(0.95);
          }
          to {
            opacity: 1;
            transform: translateY(0) scale(1);
          }
        }

        .chat-header {
          background: linear-gradient(135deg, #3b82f6 0%, #1e40af 100%);
          color: white;
          padding: 24px;
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
          gap: 16px;
        }

        .admin-avatar {
          width: 48px;
          height: 48px;
          border-radius: 50%;
          background: rgba(255, 255, 255, 0.2);
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 24px;
          backdrop-filter: blur(10px);
          border: 2px solid rgba(255, 255, 255, 0.3);
        }

        .chat-title h4 {
          margin: 0;
          font-size: 20px;
          font-weight: 700;
          letter-spacing: -0.5px;
        }

        .online-status {
          display: flex;
          align-items: center;
          gap: 8px;
          font-size: 13px;
          opacity: 0.9;
          font-weight: 500;
        }

        .online-dot {
          width: 10px;
          height: 10px;
          border-radius: 50%;
          background: #4ade80;
          animation: pulse 2s infinite;
          box-shadow: 0 0 0 0 rgba(74, 222, 128, 0.7);
        }

        @keyframes pulse {
          0% {
            box-shadow: 0 0 0 0 rgba(74, 222, 128, 0.7);
          }
          70% {
            box-shadow: 0 0 0 12px rgba(74, 222, 128, 0);
          }
          100% {
            box-shadow: 0 0 0 0 rgba(74, 222, 128, 0);
          }
        }

        .close-chat-btn {
          background: rgba(255, 255, 255, 0.1);
          border: none;
          color: white;
          font-size: 20px;
          cursor: pointer;
          padding: 12px;
          border-radius: 12px;
          transition: all 0.2s ease;
          backdrop-filter: blur(10px);
        }

        .close-chat-btn:hover {
          background: rgba(255, 255, 255, 0.2);
          transform: scale(1.1);
        }

        .chat-content {
          flex: 1;
          display: flex;
          flex-direction: column;
          background: linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%);
        }

        .messages-area {
          flex: 1;
          padding: 24px;
          padding-bottom: 120px;
          overflow-y: auto;
          overflow-x: hidden;
          display: flex;
          flex-direction: column;
          gap: 16px;
          scroll-behavior: smooth;
          scrollbar-width: thin;
          scrollbar-color: #cbd5e1 #f1f5f9;
          max-height: calc(100vh - 200px);
          min-height: 300px;
        }

        .loading-messages {
          text-align: center;
          padding: 60px 20px;
          color: #64748b;
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 20px;
        }

        .loading-spinner {
          width: 40px;
          height: 40px;
          border: 4px solid #e2e8f0;
          border-top: 4px solid #3b82f6;
          border-radius: 50%;
          animation: spin 1s linear infinite;
        }

        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }

        .empty-chat {
          text-align: center;
          padding: 60px 20px;
          color: #64748b;
        }

        .empty-chat i {
          font-size: 64px;
          margin-bottom: 24px;
          color: #cbd5e1;
          opacity: 0.6;
        }

        .empty-chat p {
          margin: 12px 0;
          font-weight: 600;
          font-size: 18px;
          color: #475569;
        }

        .empty-chat small {
          color: #94a3b8;
          font-size: 14px;
        }

        .message {
          display: flex;
          margin-bottom: 16px;
          width: 100%;
          animation: messageSlide 0.3s ease-out;
        }

        @keyframes messageSlide {
          from {
            opacity: 0;
            transform: translateY(10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
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
          max-width: 80%;
          min-width: 80px;
          padding: 12px 16px;
          border-radius: 24px;
          background: white;
          box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);
          position: relative;
          word-wrap: break-word;
          word-break: break-word;
          border: 1px solid rgba(0, 0, 0, 0.05);
        }

        .message.own .message-bubble {
          background: linear-gradient(135deg, #3b82f6 0%, #1e40af 100%);
          color: white;
          border-bottom-right-radius: 8px;
          margin-left: auto;
          margin-right: 0;
          box-shadow: 0 4px 20px rgba(59, 130, 246, 0.3);
        }

        .message.other .message-bubble {
          border-bottom-left-radius: 8px;
          background: white;
          border: 1px solid rgba(0, 0, 0, 0.05);
          margin-left: 0;
          margin-right: auto;
        }

        .message-bubble.typing {
          font-style: italic;
          opacity: 0.8;
          background: #f1f5f9;
          color: #64748b;
        }

        .message.system-message .message-bubble {
          background: linear-gradient(135deg, #dbeafe 0%, #bfdbfe 100%);
          border: 1px solid #93c5fd;
          color: #1e40af;
          font-style: italic;
          text-align: center;
          margin: 0 auto;
          max-width: 90%;
        }

        .message.guest-message .message-bubble {
          background: linear-gradient(135deg, #fef3c7 0%, #fde68a 100%);
          border: 1px solid #f59e0b;
          color: #92400e;
        }

        .message.guest-message.own .message-bubble {
          background: linear-gradient(135deg, #fef3c7 0%, #fde68a 100%);
          border: 1px solid #f59e0b;
          color: #92400e;
        }

        .guest-notice {
          margin-top: 24px;
          padding: 20px;
          background: linear-gradient(135deg, #dbeafe 0%, #bfdbfe 100%);
          border: 1px solid #93c5fd;
          border-radius: 16px;
          text-align: center;
          color: #1e40af;
        }

        .guest-notice i {
          font-size: 32px;
          margin-bottom: 12px;
          display: block;
          opacity: 0.8;
        }

        .guest-notice p {
          margin: 12px 0;
          font-weight: 600;
          font-size: 16px;
        }

        .guest-notice small {
          color: #3730a3;
          font-size: 13px;
          opacity: 0.8;
        }

        .system-indicator,
        .guest-indicator {
          font-size: 11px;
          opacity: 0.8;
          display: flex;
          align-items: center;
          gap: 4px;
          font-weight: 500;
        }

        .system-indicator i,
        .guest-indicator i {
          font-size: 11px;
        }

        .guest-form-overlay {
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: rgba(255, 255, 255, 0.98);
          backdrop-filter: blur(12px);
          z-index: 50;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 24px;
          animation: fadeIn 0.3s ease-out;
        }

        .guest-form {
          background: white;
          border-radius: 24px;
          box-shadow: 0 32px 80px rgba(0, 0, 0, 0.4);
          width: 100%;
          max-width: 420px;
          padding: 0;
          overflow: hidden;
          border: 1px solid rgba(0, 0, 0, 0.05);
        }

        .guest-form-header {
          background: linear-gradient(135deg, #3b82f6 0%, #1e40af 100%);
          color: white;
          padding: 32px;
          text-align: center;
        }

        .guest-form-header h4 {
          margin: 0 0 12px 0;
          font-size: 24px;
          font-weight: 700;
          letter-spacing: -0.5px;
        }

        .guest-form-header p {
          margin: 0;
          opacity: 0.9;
          font-size: 15px;
          font-weight: 500;
        }

        .guest-form-content {
          padding: 32px;
        }

        .form-group {
          margin-bottom: 24px;
        }

        .form-group label {
          display: block;
          margin-bottom: 12px;
          font-weight: 600;
          color: #374151;
          font-size: 15px;
        }

        .form-input {
          width: 100%;
          padding: 16px 20px;
          border: 2px solid #e5e7eb;
          border-radius: 16px;
          font-size: 15px;
          transition: all 0.3s ease;
          box-sizing: border-box;
          background: #f9fafb;
        }

        .form-input:focus {
          outline: none;
          border-color: #3b82f6;
          box-shadow: 0 0 0 4px rgba(59, 130, 246, 0.1);
          background: white;
        }

        .form-input::placeholder {
          color: #9ca3af;
        }

        .form-actions {
          margin-bottom: 20px;
        }

        .submit-btn {
          width: 100%;
          padding: 18px;
          background: linear-gradient(135deg, #3b82f6 0%, #1e40af 100%);
          color: white;
          border: none;
          border-radius: 16px;
          font-size: 16px;
          font-weight: 700;
          cursor: pointer;
          transition: all 0.3s ease;
          letter-spacing: -0.2px;
        }

        .submit-btn:hover {
          transform: translateY(-2px);
          box-shadow: 0 12px 32px rgba(59, 130, 246, 0.4);
        }

        .submit-btn:active {
          transform: translateY(0);
        }

        .form-footer {
          text-align: center;
        }

        .form-footer small {
          color: #6b7280;
          font-size: 13px;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          font-weight: 500;
        }

        .form-footer i {
          color: #10b981;
        }

        .message-bubble p {
          margin: 0;
          line-height: 1.5;
          word-wrap: break-word;
          font-size: 15px;
        }

        .message-footer {
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin-top: 6px;
          padding-top: 4px;
        }

        .message-time {
          font-size: 11px;
          opacity: 0.7;
          font-weight: 400;
          display: flex;
          align-items: center;
          gap: 4px;
        }

        .message-status {
          display: inline-flex;
          align-items: center;
          margin-left: 4px;
        }

        .status-sending {
          color: #6b7280;
        }

        .status-sending i,
        .status-sent i,
        .status-delivered i,
        .status-read i {
          font-size: 14px;
          font-weight: 600;
          display: inline-block;
        }

        .status-sent {
          color: #6b7280;
        }

        .status-delivered {
          color: #9ca3af;
        }

        .message.own .status-read {
          color: #dbeafe;
        }

        .message.other .status-read {
          color: #3b82f6;
        }

        .sending-indicator,
        .error-indicator,
        .system-indicator,
        .guest-indicator {
          display: inline-flex;
          align-items: center;
          gap: 4px;
          font-size: 11px;
          font-weight: 500;
          opacity: 0.8;
        }

        .sending-indicator {
          color: #6b7280;
          animation: pulse-sending 1.5s ease-in-out infinite;
        }

        @keyframes pulse-sending {
          0%, 100% {
            opacity: 0.6;
          }
          50% {
            opacity: 1;
          }
        }

        .error-indicator {
          color: #ef4444;
        }

        .system-indicator {
          color: #8b5cf6;
        }

        .guest-indicator {
          color: #f59e0b;
        }

        .message-input-area {
          padding: 24px;
          background: white;
          border-top: 1px solid #e5e7eb;
          box-shadow: 0 -4px 20px rgba(0, 0, 0, 0.05);
          position: sticky;
          bottom: 0;
          z-index: 10;
          min-height: 100px;
          max-height: 140px;
          display: flex;
          flex-direction: column;
          justify-content: flex-end;
          margin-top: auto;
        }

        .input-container {
          display: flex;
          gap: 16px;
          align-items: flex-end;
          width: 100%;
          max-width: 100%;
        }

        .input-wrapper {
          width: calc(100% - 72px);
          min-width: 220px;
          position: relative;
          background: #f9fafb;
          border-radius: 24px;
          border: 2px solid #e5e7eb;
          transition: all 0.3s ease;
          flex: 1;
        }

        .input-wrapper:focus-within {
          border-color: #3b82f6;
          box-shadow: 0 0 0 4px rgba(59, 130, 246, 0.1);
          background: white;
        }

        .message-input {
          width: 100%;
          padding: 16px 72px 16px 20px;
          border: none;
          border-radius: 24px;
          resize: none;
          outline: none;
          font-family: inherit;
          font-size: 15px;
          line-height: 1.4;
          background: transparent;
          min-height: 24px;
          max-height: 120px;
          overflow-y: auto;
        }

        .message-input::placeholder {
          color: #9ca3af;
        }

        .message-input:disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }

        .input-actions {
          position: absolute;
          right: 12px;
          top: 50%;
          transform: translateY(-50%);
          display: flex;
          gap: 6px;
        }

        .emoji-btn,
        .attach-btn,
        .voice-btn {
          width: 42px;
          height: 42px;
          border: none;
          background: linear-gradient(135deg, #e0f2fe 0%, #bae6fd 100%);
          color: #0369a1;
          border-radius: 50%;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 20px;
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
          box-shadow: 0 2px 8px rgba(59, 130, 246, 0.15);
          position: relative;
          overflow: hidden;
        }

        .emoji-btn::before,
        .attach-btn::before,
        .voice-btn::before {
          content: '';
          position: absolute;
          top: 50%;
          left: 50%;
          width: 0;
          height: 0;
          border-radius: 50%;
          background: rgba(59, 130, 246, 0.1);
          transform: translate(-50%, -50%);
          transition: width 0.4s ease, height 0.4s ease;
        }

        .emoji-btn:hover,
        .attach-btn:hover,
        .voice-btn:hover {
          background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%);
          color: white;
          transform: scale(1.1) translateY(-2px);
          box-shadow: 0 8px 20px rgba(59, 130, 246, 0.4);
        }

        .emoji-btn:hover::before,
        .attach-btn:hover::before,
        .voice-btn:hover::before {
          width: 100%;
          height: 100%;
        }

        .emoji-btn:active,
        .attach-btn:active,
        .voice-btn:active {
          transform: scale(0.95) translateY(0);
          box-shadow: 0 2px 8px rgba(59, 130, 246, 0.3);
        }

        .voice-btn.recording {
          background: linear-gradient(135deg, #fee2e2 0%, #fecaca 100%);
          color: #dc2626;
          box-shadow: 0 0 20px rgba(220, 38, 38, 0.4);
          animation: pulse-voice 1.5s infinite, glow-pulse 2s infinite, wiggle 0.5s ease-in-out infinite;
        }

        @keyframes wiggle {
          0%, 100% {
            transform: rotate(0deg);
          }
          25% {
            transform: rotate(-5deg);
          }
          75% {
            transform: rotate(5deg);
          }
        }

        @keyframes glow-pulse {
          0%, 100% {
            box-shadow: 0 0 20px rgba(220, 38, 38, 0.4);
          }
          50% {
            box-shadow: 0 0 30px rgba(220, 38, 38, 0.6);
          }
        }

        @keyframes pulse-voice {
          0%, 100% {
            opacity: 1;
          }
          50% {
            opacity: 0.5;
          }
        }

        /* Specific styles for each button type */
        .emoji-btn {
          background: linear-gradient(135deg, #fef3c7 0%, #fde68a 100%);
          color: #92400e;
        }

        .emoji-btn:hover {
          background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%);
          box-shadow: 0 8px 20px rgba(245, 158, 11, 0.4);
        }

        .attach-btn {
          background: linear-gradient(135deg, #e0e7ff 0%, #c7d2fe 100%);
          color: #4c1d95;
        }

        .attach-btn:hover {
          background: linear-gradient(135deg, #6366f1 0%, #4f46e5 100%);
          box-shadow: 0 8px 20px rgba(99, 102, 241, 0.4);
        }

        .voice-btn {
          background: linear-gradient(135deg, #dbeafe 0%, #bfdbfe 100%);
          color: #1e40af;
        }

        .voice-btn:hover {
          background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%);
          box-shadow: 0 8px 20px rgba(59, 130, 246, 0.4);
        }

        .voice-preview {
          display: flex;
          align-items: center;
          gap: 8px;
          position: absolute;
          right: 60px;
          top: 50%;
          transform: translateY(-50%);
          background: white;
          padding: 8px;
          border-radius: 12px;
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
        }

        .send-voice-btn,
        .cancel-voice-btn {
          width: 32px;
          height: 32px;
          border: none;
          border-radius: 50%;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 14px;
          transition: all 0.2s ease;
        }

        .send-voice-btn {
          background: #3b82f6;
          color: white;
        }

        .send-voice-btn:hover {
          background: #2563eb;
          transform: scale(1.1);
        }

        .cancel-voice-btn {
          background: #ef4444;
          color: white;
        }

        .cancel-voice-btn:hover {
          background: #dc2626;
          transform: scale(1.1);
        }

        /* File Preview Styles */
        .file-preview {
          position: absolute;
          bottom: 100%;
          left: 0;
          right: 0;
          background: white;
          border: 1px solid #e5e7eb;
          border-radius: 12px;
          padding: 16px;
          margin-bottom: 8px;
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
          animation: slideDown 0.3s ease;
        }

        @keyframes slideDown {
          from {
            opacity: 0;
            transform: translateY(-10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        .image-preview {
          display: flex;
          align-items: center;
          gap: 12px;
          margin-bottom: 12px;
        }

        .image-preview img {
          width: 60px;
          height: 60px;
          object-fit: cover;
          border-radius: 8px;
          border: 1px solid #e5e7eb;
        }

        .file-info {
          display: flex;
          flex-direction: column;
          gap: 4px;
        }

        .file-details {
          display: flex;
          flex-direction: column;
          gap: 4px;
        }

        .file-name {
          font-weight: 500;
          color: #374151;
          font-size: 14px;
          max-width: 200px;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }

        .file-size {
          font-size: 12px;
          color: #6b7280;
        }

        .file-actions {
          display: flex;
          gap: 8px;
          align-items: center;
        }

        .send-file-btn,
        .remove-file-btn {
          width: 36px;
          height: 36px;
          border: none;
          border-radius: 50%;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 14px;
          transition: all 0.2s ease;
        }

        .send-file-btn {
          background: #3b82f6;
          color: white;
        }

        .send-file-btn:hover:not(:disabled) {
          background: #2563eb;
          transform: scale(1.1);
        }

        .send-file-btn:disabled {
          background: #9ca3af;
          cursor: not-allowed;
        }

        .remove-file-btn {
          background: #ef4444;
          color: white;
        }

        .remove-file-btn:hover {
          background: #dc2626;
          transform: scale(1.1);
        }

        .uploading-spinner {
          width: 16px;
          height: 16px;
          border: 2px solid #ffffff;
          border-top: 2px solid transparent;
          border-radius: 50%;
          animation: spin 1s linear infinite;
        }

        /* Attachment Display in Messages */
        .attachment-preview {
          margin-top: 8px;
        }

        .attachment-image {
          max-width: 200px;
          max-height: 200px;
          border-radius: 8px;
          border: 1px solid #e5e7eb;
          cursor: pointer;
          transition: transform 0.2s ease;
        }

        .attachment-image:hover {
          transform: scale(1.05);
        }

        .attachment-file {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 8px 12px;
          background: #f9fafb;
          border: 1px solid #e5e7eb;
          border-radius: 8px;
          max-width: 250px;
        }

        .attachment-file i {
          font-size: 20px;
          color: #6b7280;
        }

        .attachment-info {
          display: flex;
          flex-direction: column;
          gap: 2px;
        }

        .attachment-name {
          font-weight: 500;
          color: #374151;
          font-size: 13px;
          max-width: 180px;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }

        .attachment-size {
          font-size: 11px;
          color: #6b7280;
        }

        .send-btn {
          width: 56px;
          min-width: 56px;
          height: 48px;
          border-radius: 50%;
          border: none;
          background: linear-gradient(135deg, #3b82f6 0%, #1e40af 100%);
          color: white;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: all 0.3s ease;
          font-size: 18px;
          flex-shrink: 0;
          box-shadow: 0 4px 16px rgba(59, 130, 246, 0.3);
        }

        .send-btn:hover:not(:disabled) {
          transform: scale(1.1) translateY(-1px);
          box-shadow: 0 8px 24px rgba(59, 130, 246, 0.4);
        }

        .send-btn:disabled {
          background: #9ca3af;
          cursor: not-allowed;
          transform: none;
          opacity: 0.6;
          box-shadow: none;
        }

        .send-btn.sending {
          background: linear-gradient(135deg, #10b981 0%, #059669 100%);
        }

        .sending-spinner {
          width: 24px;
          height: 24px;
          border: 3px solid rgba(255, 255, 255, 0.3);
          border-top: 3px solid white;
          border-radius: 50%;
          animation: spin 1s linear infinite;
        }

        .input-footer {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-top: 12px;
          gap: 16px;
        }

        .input-hint {
          font-size: 13px;
          color: #6b7280;
          opacity: 0.8;
          flex: 1;
          font-weight: 500;
        }

        .char-count {
          font-size: 12px;
          color: #6b7280;
          background: #f3f4f6;
          padding: 6px 12px;
          border-radius: 16px;
          font-weight: 600;
        }

        .char-count.warning {
          color: #dc2626;
          background: #fef2f2;
        }

        .emoji-picker {
          position: absolute;
          bottom: 100%;
          right: 0;
          background: white;
          border: 1px solid #e5e7eb;
          border-radius: 20px;
          box-shadow: 0 12px 32px rgba(0, 0, 0, 0.2);
          z-index: 1450;
          min-width: 280px;
          margin-bottom: 12px;
          animation: slideUp 0.2s ease-out;
        }

        .emoji-grid {
          display: grid;
          grid-template-columns: repeat(6, 1fr);
          gap: 6px;
          padding: 16px;
        }

        .emoji-item {
          width: 44px;
          height: 44px;
          border: none;
          background: none;
          border-radius: 12px;
          cursor: pointer;
          font-size: 24px;
          transition: all 0.2s ease;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .emoji-item:hover {
          background: #f3f4f6;
          transform: scale(1.15);
        }

        .emoji-picker-footer {
          padding: 12px 16px;
          border-top: 1px solid #f3f4f6;
          text-align: center;
        }

        .emoji-picker-footer small {
          color: #6b7280;
          font-size: 12px;
          font-weight: 500;
        }

        /* Scrollbar styling */
        .messages-area::-webkit-scrollbar,
        .message-input::-webkit-scrollbar {
          width: 8px;
        }

        .messages-area::-webkit-scrollbar-track,
        .message-input::-webkit-scrollbar-track {
          background: #f1f5f9;
          border-radius: 4px;
        }

        .messages-area::-webkit-scrollbar-thumb,
        .message-input::-webkit-scrollbar-thumb {
          background: #cbd5e1;
          border-radius: 4px;
        }

        .messages-area::-webkit-scrollbar-thumb:hover,
        .message-input::-webkit-scrollbar-thumb:hover {
          background: #94a3b8;
        }

        @media (max-width: 768px) {
          .floating-chat-button {
            bottom: 24px;
            right: 24px;
          }
          
          .chat-fab {
            width: 64px;
            height: 64px;
            font-size: 24px;
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
            bottom: 20px;
            right: 20px;
          }
          
          .chat-fab {
            width: 60px;
            height: 60px;
            font-size: 22px;
          }

          .input-container {
            gap: 12px;
            padding: 0 12px;
          }

          .input-wrapper {
            width: calc(100% - 64px);
            min-width: 160px;
          }

          .send-btn {
            width: 52px;
            min-width: 52px;
            height: 44px;
            font-size: 16px;
          }

          .message-input {
            padding: 14px 60px 14px 18px;
            font-size: 16px;
          }

          .messages-area {
            padding: 16px;
          }

          .message-bubble {
            max-width: 90%;
            padding: 14px 18px;
          }
        }
      `}</style>

      {/* Image Modal - Click anywhere outside to close, click image to open in browser */}
      {selectedImage && (
        <div 
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'rgba(0, 0, 0, 0.9)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 9999,
            cursor: 'pointer'
          }}
          onClick={() => setSelectedImage(null)}
        >
          <div style={{ position: 'relative', maxWidth: '90vw', maxHeight: '90vh' }}>
            <img 
              src={selectedImage.url}
              alt={selectedImage.name}
              style={{
                maxWidth: '90vw',
                maxHeight: '90vh',
                width: 'auto',
                height: 'auto',
                borderRadius: '8px',
                objectFit: 'contain',
                cursor: 'pointer'
              }}
              onClick={(e) => {
                e.stopPropagation();
                // Open in browser
                window.open(selectedImage.url, '_blank');
              }}
              onDoubleClick={(e) => {
                e.stopPropagation();
                // Download on double-click
                const link = document.createElement('a');
                link.href = selectedImage.url;
                link.download = selectedImage.name;
                link.target = '_blank';
                document.body.appendChild(link);
                link.click();
                document.body.removeChild(link);
              }}
              onError={(e) => {
                console.error('❌ Failed to load image in modal:', selectedImage.url);
                console.error('❌ Image error details:', e);
                // Try to construct absolute URL if relative
                const img = e.target as HTMLImageElement;
                if (selectedImage.url.startsWith('/static/')) {
                  const absoluteUrl = `http://localhost:3000${selectedImage.url}`;
                  console.log('🔄 Trying absolute URL:', absoluteUrl);
                  img.src = absoluteUrl;
                } else if (selectedImage.url.startsWith('static/')) {
                  const absoluteUrl = `http://localhost:3000/${selectedImage.url}`;
                  console.log('🔄 Trying absolute URL (no leading slash):', absoluteUrl);
                  img.src = absoluteUrl;
                } else {
                  console.error('❌ All URL attempts failed for:', selectedImage.url);
                  // Show a placeholder or error message
                  img.style.display = 'none';
                  const errorDiv = document.createElement('div');
                  errorDiv.innerHTML = `
                    <div style="
                      display: flex; 
                      flex-direction: column; 
                      align-items: center; 
                      justify-content: center; 
                      height: 200px; 
                      color: white; 
                      text-align: center;
                      padding: 20px;
                    ">
                      <i class="bi bi-image" style="font-size: 48px; margin-bottom: 16px; opacity: 0.5;"></i>
                      <p style="margin: 0; font-size: 16px;">Image could not be loaded</p>
                      <p style="margin: 8px 0 0 0; font-size: 12px; opacity: 0.7;">URL: ${selectedImage.url}</p>
                    </div>
                  `;
                  img.parentNode?.replaceChild(errorDiv, img);
                }
              }}
              onLoad={() => {
                console.log('✅ Image loaded successfully in modal:', selectedImage.url);
              }}
            />
            <button
              onClick={(e) => {
                e.stopPropagation();
                setSelectedImage(null);
              }}
              style={{
                position: 'absolute',
                top: '20px',
                right: '20px',
                background: 'rgba(255, 255, 255, 0.2)',
                color: 'white',
                border: 'none',
                borderRadius: '50%',
                width: '48px',
                height: '48px',
                cursor: 'pointer',
                fontSize: '24px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}
            >
              ✕
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation();
                // Download with original file extension
                const link = document.createElement('a');
                link.href = selectedImage.url;
                link.download = selectedImage.name;
                link.target = '_blank';
                document.body.appendChild(link);
                link.click();
                document.body.removeChild(link);
              }}
              style={{
                position: 'absolute',
                top: '20px',
                right: '80px',
                background: 'rgba(255, 255, 255, 0.2)',
                color: 'white',
                border: 'none',
                borderRadius: '50%',
                width: '48px',
                height: '48px',
                cursor: 'pointer',
                fontSize: '24px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}
              title="Download"
            >
              ↓
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation();
                // Open in browser
                window.open(selectedImage.url, '_blank');
              }}
              style={{
                position: 'absolute',
                top: '20px',
                right: '140px',
                background: 'rgba(255, 255, 255, 0.2)',
                color: 'white',
                border: 'none',
                borderRadius: '50%',
                width: '48px',
                height: '48px',
                cursor: 'pointer',
                fontSize: '24px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}
              title="Open in browser"
            >
              →
            </button>
          </div>
        </div>
      )}
        </>
    );
};

export default FloatingAdminChat; 