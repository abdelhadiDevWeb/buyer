'use client'
import './style.css'
import { useEffect, useRef, useState, useCallback } from 'react'
import { BiSearch, BiSend, BiArrowBack, BiPhone, BiVideo, BiDotsVerticalRounded } from 'react-icons/bi'
import { BsChatDots, BsEmojiSmile, BsThreeDotsVertical } from 'react-icons/bs'
import { HiOutlinePaperAirplane, HiOutlineEmojiHappy } from 'react-icons/hi'
import { IoMdSend, IoMdAttach } from 'react-icons/io'
import { RiMessage3Line, RiUser3Line } from 'react-icons/ri'
import { ChatAPI } from '@/app/api/chat'
import { MessageAPI } from '@/app/api/messages'
import { useCreateSocket } from '@/contexts/socket'
import { useRouter, useSearchParams } from 'next/navigation'
import Image from 'next/image'

// Define TypeScript interfaces
interface User {
  _id: string
  firstName: string
  lastName: string
  avatar?: string
  [key: string]: any
}

interface Chat {
  _id: string
  users: User[]
  createdAt: string
  lastMessage?: string
  unreadCount?: number
}

interface Message {
  _id: string
  idChat: string
  message: string
  sender: string
  reciver: string
  createdAt: string
  isRead?: boolean
}

type SocketMessage = Message;

export default function Chat() {
  const t = (key: string, _opts?: any) => key;
  const router = useRouter()
  const searchParams = useSearchParams()
  const [err, setErr] = useState<boolean>(false)
  const [search, setSearch] = useState<string>('')
  const [userChat, setUserChat] = useState<User | null>(null)
  const [idChat, setIdChat] = useState<string>('')
  const [chats, setChats] = useState<Chat[]>([])
  const [text, setText] = useState<string>('')
  const [reget, setReget] = useState<boolean>(false)
  const [arr, setArr] = useState<Chat[]>([])
  const [messages, setMessages] = useState<Message[]>([])
  const [loading, setLoading] = useState<boolean>(false)
  const [typing, setTyping] = useState<boolean>(false)
  const [isOnline, setIsOnline] = useState<boolean>(false)
  const [showEmojiPicker, setShowEmojiPicker] = useState<boolean>(false)

  const messagesEndRef = useRef<HTMLDivElement>(null)
  const textRef = useRef<HTMLInputElement>(null)
  const socketContext = useCreateSocket()
  const socket = socketContext?.socket

  // Check authentication
  useEffect(() => {
    const auth = localStorage.getItem('auth')
    console.log('🔐 Auth check:', auth ? 'Found' : 'Not found')
    if (!auth) {
      console.log('❌ No auth data found, setting error')
      setErr(true)
    } else {
      try {
        const authData = JSON.parse(auth)
        console.log('🔐 Auth data structure:', {
          hasUser: !!authData.user,
          hasTokens: !!authData.tokens,
          userKeys: authData.user ? Object.keys(authData.user) : [],
          userId: authData.user?._id,
          userType: authData.user?.type
        })
        
        // Check for user data in different possible structures
        const hasValidUser = authData.user && (
          authData.user._id || 
          authData.user.id ||
          (authData.user.user && authData.user.user._id)
        )
        
        if (!hasValidUser) {
          console.log('❌ No valid user data found, setting error')
          setErr(true)
        } else {
          console.log('✅ Valid auth data found')
        }
      } catch (error) {
        console.error('❌ Error parsing auth data:', error)
        setErr(true)
      }
    }
  }, [])

  // Fetch chats
  const getChats = useCallback(async () => {
    try {
      console.log('🔍 Fetching chats...')
      
      // Get user ID from auth data with robust extraction
      const authData = localStorage.getItem('auth')
      if (!authData) {
        console.error('❌ No auth data found')
        return
      }
      
      const userData = JSON.parse(authData)
      console.log('🔍 User data structure:', {
        hasUser: !!userData.user,
        userKeys: userData.user ? Object.keys(userData.user) : [],
        directId: userData.user?._id,
        nestedId: userData.user?.user?._id,
        rootId: userData._id
      })
      
      // Try multiple ways to extract user ID
      let userId = userData?.user?._id || 
                   userData?.user?.id || 
                   userData?.user?.user?._id || 
                   userData?._id
      
      if (!userId) {
        console.error('❌ No user ID found in auth data')
        console.error('❌ Available data:', userData)
        return
      }
      
      console.log('✅ User ID for chat fetch:', userId)
      
      // Call the correct API endpoint with proper parameters
      const response = await ChatAPI.getChats({
        id: userId,
        from: 'client' // Use 'client' instead of 'buyer' to match server logic
      })
      
      console.log('📨 Chats response:', response)
      if (response.data) {
        setChats(response.data as Chat[])
        setArr(response.data as Chat[])
        console.log('✅ Chats loaded:', response.data.length)
      } else {
        console.log('⚠️ No chat data in response')
      }
    } catch (error) {
      console.error('❌ Error fetching chats:', error)
    }
  }, [])

  // Fetch messages for a specific chat
  const getMessages = useCallback(async (chatId: string) => {
    try {
    setLoading(true)
      const response = await MessageAPI.getByConversation(chatId)
      if (response.data) {
        setMessages(response.data)
      }
    } catch (error) {
      console.error('Error fetching messages:', error)
    } finally {
      setLoading(false)
    }
  }, [])

  // Mark chat as read
  const markChatAsRead = useCallback((chatId: string) => {
    setChats(prevChats => 
      prevChats.map(chat => 
        chat._id === chatId 
          ? { ...chat, unreadCount: 0 }
          : chat
      )
    )
  }, [])

  // Send message
  const sendMessage = useCallback(async () => {
    if (!text.trim() || !idChat) return

    try {
      const authData = localStorage.getItem('auth')
      if (!authData) return
      
      const userData = JSON.parse(authData)
      const currentUserId = userData?.user?._id || 
                           userData?.user?.id || 
                           userData?.user?.user?._id || 
                           userData?._id
      
      if (!currentUserId) return

      const messageData = {
        idChat,
        message: text.trim(),
        sender: currentUserId,
        reciver: userChat?._id || ''
      }

      await MessageAPI.send(messageData)
      setText('')
      setReget(prev => !prev)
    } catch (error) {
      console.error('Error sending message:', error)
    }
  }, [text, idChat, userChat])

  // Handle chat selection
  const handleChatSelect = useCallback((chat: Chat) => {
    try {
      const authData = localStorage.getItem('auth')
      if (!authData) return
      
      const userData = JSON.parse(authData)
      const currentUserId = userData?.user?._id || 
                           userData?.user?.id || 
                           userData?.user?.user?._id || 
                           userData?._id
      
      if (!currentUserId) return
      
      const otherUser = chat.users.find(user => user._id !== currentUserId)
      if (otherUser) {
        setUserChat(otherUser)
        setIdChat(chat._id)
        markChatAsRead(chat._id)
        getMessages(chat._id)
      }
    } catch (error) {
      console.error('Error in handleChatSelect:', error)
    }
  }, [markChatAsRead, getMessages])

  // Filter chats based on search
  useEffect(() => {
    if (search.trim()) {
      const filtered = chats.filter(chat => 
        chat.users.some(user => 
          `${user.firstName} ${user.lastName}`.toLowerCase().includes(search.toLowerCase())
        )
      )
      setArr(filtered)
    } else {
      setArr(chats)
    }
  }, [search, chats])

  // Socket event listeners
  useEffect(() => {
    if (!socket || !socket.on) return

    const handleNewMessage = (data: SocketMessage) => {
      if (data.idChat === idChat) {
        setMessages(prev => [...prev, data])
      }
      setReget(prev => !prev)
    }

    const handleAdminMessage = (data: SocketMessage) => {
      if (data.idChat === idChat) {
        setMessages(prev => [...prev, data])
      }
      setReget(prev => !prev)
    }

    socket.on('sendMessage', handleNewMessage)
    socket.on('adminMessage', handleAdminMessage)

    return () => {
      if (socket && socket.off) {
        socket.off('sendMessage', handleNewMessage)
        socket.off('adminMessage', handleAdminMessage)
      }
    }
  }, [socket, idChat])

  // Scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  // Load chats on mount
  useEffect(() => {
    if (!err) {
      getChats()
    }
  }, [err, getChats, reget])

  // Handle key press
  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      sendMessage()
    }
  }

  // Format time
  const formatTime = (dateString: string) => {
    if (!dateString) return ''
    
    try {
      const date = new Date(dateString)
      if (isNaN(date.getTime())) return ''
      
      const now = new Date()
      const diff = now.getTime() - date.getTime()
      const days = Math.floor(diff / (1000 * 60 * 60 * 24))
      
      if (days === 0) {
        return date.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })
      } else if (days === 1) {
        return 'Hier'
      } else if (days < 7) {
        return date.toLocaleDateString('fr-FR', { weekday: 'short' })
      } else {
        return date.toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit' })
      }
    } catch (error) {
      console.error('Error formatting time:', error)
      return ''
    }
  }

  // Format message date
  const formatMessageDate = (dateString: string) => {
    if (!dateString) return ''
    
    try {
      const date = new Date(dateString)
      if (isNaN(date.getTime())) return ''
      
      const now = new Date()
      const diff = now.getTime() - date.getTime()
      const days = Math.floor(diff / (1000 * 60 * 60 * 24))
      
      if (days === 0) {
        return "Aujourd'hui"
      } else if (days === 1) {
        return "Hier"
      } else if (days < 7) {
        return date.toLocaleDateString('fr-FR', { weekday: 'long' })
      } else {
        return date.toLocaleDateString('fr-FR', { day: 'numeric', month: 'long' })
      }
    } catch (error) {
      console.error('Error formatting message date:', error)
      return ''
    }
  }

  // Group messages by date
  const groupMessagesByDate = (messages: Message[]) => {
    if (!Array.isArray(messages)) {
      console.warn('groupMessagesByDate: messages is not an array', messages)
      return {}
    }
    
    const groups: { [key: string]: Message[] } = {}
    
    messages.forEach((message, index) => {
      if (!message || !message.createdAt) {
        console.warn(`groupMessagesByDate: message at index ${index} is invalid`, message)
        return
      }
      
      try {
        const date = new Date(message.createdAt)
        if (isNaN(date.getTime())) {
          console.warn(`groupMessagesByDate: invalid date for message at index ${index}`, message.createdAt)
          return
        }
        
        const dateString = date.toDateString()
        if (!groups[dateString]) {
          groups[dateString] = []
        }
        groups[dateString].push(message)
      } catch (error) {
        console.error(`Error grouping message by date at index ${index}:`, error, message)
      }
    })
    
    return groups
  }

  const goBack = () => {
    router.push('/')
  }

  if (err) {
    return (
      <div className="modern-error-container">
        <div className="error-content">
          <div className="error-icon">
            <RiMessage3Line />
          </div>
          <h2>Accès non autorisé</h2>
          <p>Vous devez être connecté pour accéder aux messages</p>
          <button className="error-button" onClick={goBack}>
            <BiArrowBack />
            Retour à l'accueil
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="modern-chat-app">
      {/* Header */}
      <div className="chat-header-modern">
        <button className="back-button-modern" onClick={goBack}>
          <BiArrowBack />
        </button>
        <div className="header-content">
          <h1>Messages</h1>
          <p>Discutez en temps réel</p>
        </div>
        <div className="header-actions">
          <button className="action-button">
            <BiSearch />
          </button>
          <button className="action-button">
            <BsThreeDotsVertical />
          </button>
        </div>
      </div>

      <div className="chat-main-container">
        {/* Sidebar */}
        <div className="chat-sidebar-modern">
          <div className="sidebar-header">
            <div className="search-container-modern">
              <BiSearch className="search-icon" />
              <input 
                type="text" 
                placeholder="Rechercher une conversation..."
                value={search} 
                onChange={(e) => setSearch(e.target.value)} 
                className="search-input-modern"
              />
            </div>
          </div>
  
          <div className="conversations-list">
            {arr.length === 0 ? (
              <div className="empty-conversations">
                <div className="empty-icon">
                  <BsChatDots />
                </div>
                <h3>Aucune conversation</h3>
                <p>Commencez une nouvelle conversation</p>
              </div>
            ) : (
              arr.map((chat) => {
                let currentUserId = null
                try {
                  const authData = localStorage.getItem('auth')
                  if (authData) {
                    const userData = JSON.parse(authData)
                    currentUserId = userData?.user?._id || 
                                   userData?.user?.id || 
                                   userData?.user?.user?._id || 
                                   userData?._id
                  }
                } catch (error) {
                  console.error('Error getting current user ID:', error)
                }
                
                if (!currentUserId) return null
                
                const otherUser = chat.users.find(user => user._id !== currentUserId)
                if (!otherUser) return null
                
                return (
                  <div 
                    key={chat._id}
                    className={`conversation-item ${idChat === chat._id ? 'active' : ''}`}
                    onClick={() => handleChatSelect(chat)}
                  >
                    <div className="conversation-avatar">
                      <Image
                        src={otherUser.avatar || '/assets/images/avatar.jpg'}
                        alt={`${otherUser.firstName} ${otherUser.lastName}`}
                        width={50}
                        height={50}
                        className="avatar-image"
                        onError={(e: any) => {
                          const target = e.target as HTMLImageElement
                          target.src = '/assets/images/avatar.jpg'
                        }}
                      />
                      <div className={`online-status ${isOnline ? 'online' : 'offline'}`}></div>
                    </div>
                    <div className="conversation-content">
                      <div className="conversation-header">
                        <h4>{otherUser.firstName} {otherUser.lastName}</h4>
                        <span className="conversation-time">
                          {chat.createdAt ? formatTime(chat.createdAt) : ''}
                        </span>
                      </div>
                      <div className="conversation-preview">
                        <p>{chat.lastMessage || 'Aucun message'}</p>
                        {chat.unreadCount && chat.unreadCount > 0 && (
                          <div className="unread-badge">
                            {chat.unreadCount}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                )
              })
            )}
          </div>
        </div>
  
        {/* Chat Area */}
        <div className="chat-area-modern">
          {!idChat ? (
            <div className="empty-chat-modern">
              <div className="empty-chat-content">
                <div className="empty-chat-icon">
                  <RiMessage3Line />
                </div>
                <h3>Sélectionnez une conversation</h3>
                <p>Choisissez une conversation pour commencer à discuter</p>
              </div>
            </div>
          ) : (
            <div className="chat-conversation-wrapper">
              {/* Chat Header */}
              <div className="chat-conversation-header">
                <div className="conversation-info">
                  <div className="conversation-avatar-small">
                    <Image
                      src={userChat?.avatar || '/assets/images/avatar.jpg'}
                      alt={`${userChat?.firstName} ${userChat?.lastName}`}
                      width={40}
                      height={40}
                      className="avatar-image-small"
                      onError={(e: any) => {
                        const target = e.target as HTMLImageElement
                        target.src = '/assets/images/avatar.jpg'
                      }}
                    />
                    <div className={`online-status-small ${isOnline ? 'online' : 'offline'}`}></div>
                  </div>
                  <div className="conversation-details">
                    <h4>{userChat?.firstName} {userChat?.lastName}</h4>
                    <span className="status-text">
                      {isOnline ? 'En ligne' : 'Hors ligne'}
                    </span>
                  </div>
                </div>
                <div className="conversation-actions">
                  <button className="action-btn">
                    <BiPhone />
                  </button>
                  <button className="action-btn">
                    <BiVideo />
                  </button>
                  <button className="action-btn">
                    <BiDotsVerticalRounded />
                  </button>
                </div>
              </div>
                    
              {/* Messages Area */}
              <div className="messages-container">
                {loading ? (
                  <div className="loading-messages">
                    <div className="loading-spinner"></div>
                    <p>Chargement des messages...</p>
                  </div>
                ) : messages.length === 0 ? (
                  <div className="empty-messages-modern">
                    <div className="empty-messages-icon">
                      <RiMessage3Line />
                    </div>
                    <h4>Aucun message</h4>
                    <p>Envoyez votre premier message</p>
                  </div>
                ) : (
                  <div className="messages-list">
                    {Array.isArray(messages) && messages.length > 0 ? Object.entries(groupMessagesByDate(messages)).map(([date, dateMessages]) => (
                      <div key={date}>
                        <div className="date-divider">
                          <span>{dateMessages[0]?.createdAt ? formatMessageDate(dateMessages[0].createdAt) : ''}</span>
                        </div>
                        {dateMessages.map((message) => {
                          let isSender = false
                          try {
                            const authData = localStorage.getItem('auth')
                            if (authData) {
                              const userData = JSON.parse(authData)
                              const currentUserId = userData?.user?._id || 
                                                   userData?.user?.id || 
                                                   userData?.user?.user?._id || 
                                                   userData?._id
                              isSender = message.sender === currentUserId
                            }
                          } catch (error) {
                            console.error('Error checking message sender:', error)
                          }
                          
                          return (
                            <div
                              key={message._id}
                              className={`message-wrapper-modern ${isSender ? 'sender' : 'receiver'}`}
                            >
                              <div className={`message-bubble ${isSender ? 'sent' : 'received'}`}>
                                <p>{message.message}</p>
                                <span className="message-time">
                                  {message.createdAt ? formatTime(message.createdAt) : ''}
                                </span>
                              </div>
                            </div>
                          )
                        })}
                      </div>
                    )) : null}
                    <div ref={messagesEndRef} />
                  </div>
                )}

                {/* Message Input */}
                <div className="message-input-container">
                  <div className="input-wrapper">
                    <button className="attach-button">
                      <IoMdAttach />
                    </button>
                    <div className="input-field">
                      <input 
                        ref={textRef}
                        type="text" 
                        placeholder="Tapez votre message..."
                        value={text} 
                        onChange={(e) => setText(e.target.value)} 
                        onKeyPress={handleKeyPress}
                        className="message-input"
                      />
                      <button 
                        className="emoji-button"
                        onClick={() => setShowEmojiPicker(!showEmojiPicker)}
                      >
                        <HiOutlineEmojiHappy />
                      </button>
                    </div>
                    <button 
                      className={`send-button ${text.trim() ? 'active' : ''}`}
                      onClick={sendMessage}
                      disabled={!text.trim()}
                    >
                      <IoMdSend />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}