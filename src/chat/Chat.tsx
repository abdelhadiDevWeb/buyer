import './style.css'
import { useEffect, useRef, useState } from 'react'
import { ChatAPI } from '@/app/api/chat';
import { MessageAPI } from '@/app/api/messages';
import { NotificationAPI } from '@/app/api/notification';
import { useCreateSocket } from '@/contexts/socket';
import { authStore } from '@/contexts/authStore';
import { BiSearch } from 'react-icons/bi';
import { BsChatDots } from 'react-icons/bs';
import { IoMdSend, IoMdClose } from 'react-icons/io';

interface ChatType {
  _id: string;
  users: UserType[];
  createdAt: string;
}

interface UserType {
  _id: string;
  firstName: string;
  lastName: string;
}

interface MessageType {
  _id: string;
  idChat: string;
  message: string;
  sender: string;
  createdAt: string;
}

interface SocketContextData {
  showChat: boolean;
  messages: MessageType[];
  setMessages: (messages: MessageType[] | ((prev: MessageType[]) => MessageType[])) => void;
  setShowChat: (show: boolean) => void;
  socket: unknown;
  onlineUsers: unknown[];
  setRelode: (relode: boolean) => void;
}

interface ChatProps {
  setShow?: (show: boolean) => void;
  check?: boolean;
  setCheck?: (check: boolean) => void;
}

export default function Chat({ setShow, check, setCheck }: ChatProps) {
    const [idChat, setIdChat] = useState<string>('')
    const [userChat, setUserChat] = useState<UserType | null>(null)
    const [chats, setChats] = useState<ChatType[]>([])
    const [err, setErr] = useState<boolean>(false)
    const [search, setSearch] = useState<string>('')
    const [arr, setArr] = useState<ChatType[]>([])
    const [reget, setReget] = useState<boolean>(false)
    const [text, setText] = useState<string>('')
    const [isMobile, setIsMobile] = useState<boolean>(false)
    const [showChatList, setShowChatList] = useState<boolean>(true)

    const socketContext = useCreateSocket() as SocketContextData | null;
    const setSocketMessage = socketContext?.setMessages || (() => {});
    const socket = socketContext?.socket;
    const messages = socketContext?.messages || [];

    // Check if mobile device
    useEffect(() => {
        const checkMobile = () => {
            setIsMobile(window.innerWidth <= 768);
        };
        checkMobile();
        window.addEventListener('resize', checkMobile);
        return () => window.removeEventListener('resize', checkMobile);
    }, []);

    useEffect(()=>{
       if(!window.localStorage.getItem('auth')) {
        setErr(true)
       }
    },[])

    // Join chat room when idChat changes and socket is ready
    useEffect(() => {
        if (!socket || !idChat) return;
        
        console.log('Joining chat room:', idChat);
        (socket as any).emit('joinChat', { chatId: idChat });
        
        // Clear previous socket messages when switching chats
        setSocketMessage([]);
        
        return () => {
            console.log('Leaving chat room:', idChat);
            (socket as any).emit('leaveChat', { chatId: idChat });
        };
    }, [socket, idChat, setSocketMessage]);

    // Listen for real-time messages
    useEffect(() => {
        if (!socket) return;

        const handleNewMessage = (data: any) => {
            console.log('📨 New message received:', data);
            if (data.idChat === idChat) {
                setSocketMessage(prev => {
                    // Check if message already exists to avoid duplicates
                    const exists = prev.some(msg => msg._id === data._id);
                    if (exists) return prev;
                    
                    return [...prev, {
                        _id: data._id,
                        idChat: data.idChat,
                        message: data.message,
                        sender: data.sender,
                        createdAt: data.createdAt
                    }];
                });
            }
        };

        const handleBuyerToSellerMessage = (data: any) => {
            console.log('📨 Buyer to seller message received:', data);
            if (data.chatId === idChat) {
                setSocketMessage(prev => {
                    const exists = prev.some(msg => msg._id === data.messageId);
                    if (exists) return prev;
                    
                    return [...prev, {
                        _id: data.messageId,
                        idChat: data.chatId,
                        message: data.message,
                        sender: data.sender,
                        createdAt: data.timestamp
                    }];
                });
            }
        };

        const handleChatMessageUpdate = (data: any) => {
            console.log('📡 Chat message update received:', data);
            if (data.chatId === idChat) {
                setSocketMessage(prev => {
                    const exists = prev.some(msg => msg._id === data.messageId);
                    if (exists) return prev;
                    
                    return [...prev, {
                        _id: data.messageId,
                        idChat: data.chatId,
                        message: data.message,
                        sender: data.sender,
                        createdAt: data.timestamp
                    }];
                });
            }
        };

        // Listen for different message events
        (socket as any).on('sendMessage', handleNewMessage);
        (socket as any).on('buyerToSellerMessage', handleBuyerToSellerMessage);
        (socket as any).on('chatMessageUpdate', handleChatMessageUpdate);

        return () => {
            (socket as any).off('sendMessage', handleNewMessage);
            (socket as any).off('buyerToSellerMessage', handleBuyerToSellerMessage);
            (socket as any).off('chatMessageUpdate', handleChatMessageUpdate);
        };
    }, [socket, idChat, setSocketMessage]);

    useEffect(()=>{
       if(search == '') return
       console.log(search);
       
       const newAr = chats.filter((e)=>e.users[0].firstName.trim().toLocaleLowerCase().includes(search.trim().toLocaleLowerCase()) ||
       e.users[0].lastName.trim().toLocaleLowerCase().includes(search.trim().toLocaleLowerCase())
      )      
      console.log('AO ',newAr);
      
      setArr(newAr)
    },[search])


    const chatRef = useRef<HTMLDivElement | null>(null)

    useEffect(()=>{
      const scrolB = ()=>{
        if(chatRef.current){
          setTimeout(() => {
             chatRef.current?.scrollTo({
             top: chatRef.current?.scrollHeight + 50,
             behavior: "smooth"
           })
          }, 200);
      }
      }
      requestAnimationFrame(scrolB)
    },[idChat, reget])


     useEffect(()=>{
      getAllChats()
    },[])


       const getAllChats = async () => {
          const user : string | null = window.localStorage.getItem('auth')
          
          const id:string  = user ? JSON.parse(user).user._id : '';
          const token : string = user ? JSON.parse(user).tokens.accessToken : '';
          if(!id) return
  
          console.log('Toe ', token);
          console.log(id);
          
          
         try {
             const res = await ChatAPI.getChats({ id: id, from: 'buyer' });

          console.log("res chats", res);
          setChats((res as any).data || res as unknown as ChatType[])
         } catch (err) {
             console.log(err);
               
         }
          
          
    }




        
        useEffect(()=>{
          if(idChat == '') return
            getAllMessage()
        },[idChat, reget])
    
    
    
    
    const getAllMessage = async ()=>{
          const user : string | null = window.localStorage.getItem('auth')
          const token : string = user ? JSON.parse(user).tokens.accessToken : '';
        const res = await MessageAPI.getByConversation(idChat, {
               headers: {
                  Authorization: `Bearer ${token}`,
                  'x-access-key': "8f2a61c94d7e3b5f9c0a8d2e6b4f1c7a"
               },
             })
        console.log('Res Mes', res);
        setSocketMessage((res as any).data || res as unknown as MessageType[])
    }

    const createMessage = async () => {
        if (!text.trim() || !idChat) return;
        
        const user : string | null = window.localStorage.getItem('auth')
        const userId : string = user ? JSON.parse(user).user._id : '';
        
        const messageText = text.trim();
        setText(''); // Clear input immediately for better UX
        
        // Add message to UI immediately for instant feedback
        const tempMessage = {
            _id: `temp_${Date.now()}`,
            idChat: idChat,
            message: messageText,
            sender: userId,
            createdAt: new Date().toISOString()
        };
        
        // Add message to UI instantly
        setSocketMessage(prev => [...prev, tempMessage]);
        
        // Send to API in background (don't wait for response)
        const messageData = {
            idChat: idChat,
            message: messageText,
            sender: userId,
            reciver: userChat?._id || ''
        };
        
        // Send to API without waiting
        MessageAPI.send(messageData).then(response => {
            // Replace temp message with real message from API
            if (response && (response as any)._id) {
                setSocketMessage(prev => 
                    prev.map(msg => 
                        msg._id === tempMessage._id 
                            ? { 
                                _id: (response as any)._id,
                                idChat: idChat,
                                message: (response as any).message,
                                sender: (response as any).sender,
                                createdAt: (response as any).createdAt
                              }
                            : msg
                    )
                );
            }
        }).catch(error => {
            console.error('Error sending message:', error);
            // Remove temp message on error
            setSocketMessage(prev => prev.filter(msg => msg._id !== tempMessage._id));
            setText(messageText); // Restore text on error
        });
    };

    const handleChatSelect = async (chat: ChatType) => {
        setUserChat(chat.users[0]);
        setIdChat(chat._id);
        
        // Mark messages and notifications as read when chat is selected
        try {
            const { auth } = authStore.getState();
            if (auth?.user?._id) {
                console.log('🔖 Marking chat as read for user:', auth.user._id, 'chatId:', chat._id);
                
                // Mark messages as read using existing endpoint
                await MessageAPI.markAllAsRead(chat._id);
                console.log('✅ Messages marked as read successfully');
                
                // Mark notifications as read using existing endpoint
                await NotificationAPI.markChatAsRead(chat._id);
                console.log('✅ Notifications marked as read successfully');
            }
        } catch (error) {
            console.error('❌ Error marking chat as read:', error);
        }
        
        if (isMobile) {
            setShowChatList(false);
        }
    };

    const handleBackToChatList = () => {
        setShowChatList(true);
        setUserChat(null);
        setIdChat('');
    };
    
    
    



    return (
        <div className={`responsive-chat-container ${isMobile ? 'mobile' : 'desktop'}`}>
            {/* Mobile: Show only chat list initially */}
            {isMobile && showChatList && (
                <>
                    <div className="mobile-chat-list-header">
                        <h2>Messages</h2>
                        <button className="close-btn" onClick={() => setShow?.(false)}>
                            <IoMdClose size={24} />
                        </button>
                    </div>
                    
                    <div className="mobile-chat-list">
                        <div className="search-box">
                            <BiSearch size={20} />
                            <input 
                                type="text" 
                                placeholder="Search conversations..." 
                                value={search} 
                                onChange={(e) => setSearch(e.target.value)}
                            />
                        </div>
                        
                        <div className="chats-list">
                            {chats.map((chat, i) => (
                                <div 
                                    key={i} 
                                    className="chat-item"
                                    onClick={() => handleChatSelect(chat)}
                                >
                                    <div className="chat-avatar">
                                        <img 
                                            src="/assets/images/avatar.jpg" 
                                            alt={chat.users[0].firstName}
                                        />
                                    </div>
                                    <div className="chat-info">
                                        <div className="chat-name">
                                            {chat.users[0].firstName} {chat.users[0].lastName}
                                        </div>
                                        <div className="chat-preview">
                                            {'No messages yet'}
                                        </div>
                                    </div>
                                    <div className="chat-time">
                                        {new Date(chat.createdAt).toLocaleTimeString('en-US', { 
                                            hour: '2-digit', 
                                            minute: '2-digit' 
                                        })}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </>
            )}

            {/* Mobile: Show full chat when conversation is selected */}
            {isMobile && !showChatList && (
                <>
                    <div className="mobile-chat-header">
                        <button className="back-button" onClick={handleBackToChatList}>
                            ← Back
                        </button>
                        <div className="chat-user-info">
                            <div className="user-avatar">
                                <img 
                                    src="/assets/images/avatar.jpg" 
                                    alt={userChat?.firstName}
                                />
                            </div>
                            <div className="user-details">
                                <h3>{userChat?.firstName} {userChat?.lastName}</h3>
                                <span className="online-status">Online</span>
                            </div>
                        </div>
                        <button className="close-button" onClick={() => setShow?.(false)}>
                            <IoMdClose size={24} />
                        </button>
                    </div>
                    
                    <div className="mobile-chat-view">
                        <div className="messages-area" ref={chatRef}>
                            {messages
                                .filter((msg: MessageType) => msg.idChat === idChat)
                                .map((msg, i) => {
                                    const authData = window.localStorage.getItem('auth');
                                    const userId = authData ? JSON.parse(authData).user._id : '';
                                    const isOwnMessage = msg.sender === userId;
                                    
                                    return (
                                        <div 
                                            key={`${msg._id}-${i}`} 
                                            className={`message ${isOwnMessage ? 'own' : 'other'}`}
                                        >
                                            <div className="message-bubble">
                                                <p>{msg.message}</p>
                                                <span className="message-time">
                                                    {new Date(msg.createdAt).toLocaleTimeString('en-US', { 
                                                        hour: '2-digit', 
                                                        minute: '2-digit' 
                                                    })}
                                                </span>
                                            </div>
                                        </div>
                                    );
                                })}
                        </div>
                        
                        <div className="message-input-area">
                            <input 
                                type="text" 
                                value={text} 
                                onChange={(e) => setText(e.target.value)}
                                onKeyDown={(e) => {
                                    if (e.key === 'Enter') {
                                        createMessage();
                                    }
                                }}
                                placeholder="Type a message..." 
                            />
                            <button className="send-btn" onClick={createMessage}>
                                <IoMdSend size={20} />
                            </button>
                        </div>
                    </div>
                </>
            )}

            {/* Desktop: Show both chat list and conversation */}
            {!isMobile && (
                <>
                    <div className="chat-header">
                        <h2>Messages</h2>
                        <button className="close-btn" onClick={() => setShow?.(false)}>
                            <IoMdClose size={24} />
                        </button>
                    </div>
                    
                    <div className="chat-content">
                        <div className="chat-sidebar">
                            <div className="search-box">
                                <BiSearch size={20} />
                                <input 
                                    type="text" 
                                    placeholder="Search conversations..." 
                                    value={search} 
                                    onChange={(e) => setSearch(e.target.value)}
                                />
                            </div>
                            
                            <div className="chats-list">
                                {chats.map((chat, i) => (
                                    <div 
                                        key={i} 
                                        className={`chat-item ${idChat === chat._id ? 'active' : ''}`}
                                        onClick={() => handleChatSelect(chat)}
                                    >
                                        <div className="chat-avatar">
                                            <img 
                                                src="/assets/images/avatar.jpg" 
                                                alt={chat.users[0].firstName}
                                            />
                                        </div>
                                        <div className="chat-info">
                                            <div className="chat-name">
                                                {chat.users[0].firstName} {chat.users[0].lastName}
                                            </div>
                                            <div className="chat-preview">
                                                {'No messages yet'}
                                            </div>
                                        </div>
                                        <div className="chat-time">
                                            {new Date(chat.createdAt).toLocaleTimeString('en-US', { 
                                                hour: '2-digit', 
                                                minute: '2-digit' 
                                            })}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                        
                        <div className="chat-main">
                            {idChat === '' ? (
                                <div className="empty-chat">
                                    <BsChatDots size={64} color="#ccc" />
                                    <h3>Select a conversation</h3>
                                    <p>Choose a conversation to start messaging</p>
                                </div>
                            ) : (
                                <>
                                    <div className="chat-header-main">
                                        <div className="user-info">
                                            <img 
                                                src="/assets/images/avatar.jpg" 
                                                alt={userChat?.firstName}
                                                className="user-avatar"
                                            />
                                            <div>
                                                <h3>{userChat?.firstName} {userChat?.lastName}</h3>
                                                <span className="online-status">Online</span>
                                            </div>
                                        </div>
                                    </div>
                                    
                                    <div className="messages-area" ref={chatRef}>
                                        {messages
                                            .filter((msg: MessageType) => msg.idChat === idChat)
                                            .map((msg, i) => {
                                                const authData = window.localStorage.getItem('auth');
                                                const userId = authData ? JSON.parse(authData).user._id : '';
                                                const isOwnMessage = msg.sender === userId;
                                                
                                                return (
                                                    <div 
                                                        key={`${msg._id}-${i}`} 
                                                        className={`message ${isOwnMessage ? 'own' : 'other'}`}
                                                    >
                                                        <div className="message-bubble">
                                                            <p>{msg.message}</p>
                                                            <span className="message-time">
                                                                {new Date(msg.createdAt).toLocaleTimeString('en-US', { 
                                                                    hour: '2-digit', 
                                                                    minute: '2-digit' 
                                                                })}
                                                            </span>
                                                        </div>
                                                    </div>
                                                );
                                            })}
                                    </div>
                                    
                                    <div className="message-input-area">
                                        <input 
                                            type="text" 
                                            value={text} 
                                            onChange={(e) => setText(e.target.value)}
                                            onKeyDown={(e) => {
                                                if (e.key === 'Enter') {
                                                    createMessage();
                                                }
                                            }}
                                            placeholder="Type a message..." 
                                        />
                                        <button className="send-btn" onClick={createMessage}>
                                            <IoMdSend size={20} />
                                        </button>
                                    </div>
                                </>
                            )}
                        </div>
                    </div>
                </>
            )}
        </div>
    )
}