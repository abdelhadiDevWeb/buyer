import React, { createContext, useEffect, useState, useContext, ReactNode, useCallback } from 'react';
import { io, Socket } from 'socket.io-client';

interface Props {
  children?: ReactNode;
  setShow?: (val: boolean) => void;
  setCheck?: (val: boolean) => void;
}

interface SocketContextData {
  socket: Socket | undefined;
  onlineUsers: unknown;
  messages: unknown;
  setMessages: unknown;
  setRelode: React.Dispatch<React.SetStateAction<boolean>>;
  showChat: boolean;
  setShowChat: React.Dispatch<React.SetStateAction<boolean>>;
  socketError: string | null;
  setSocketError: React.Dispatch<React.SetStateAction<string | null>>;
}

const CreateSocket = createContext<SocketContextData | null>(null);

export function useCreateSocket() {
  return useContext(CreateSocket);
}

// Modified component to work with Next.js App Router
const SocketProvider: React.FC<Props> = (props = {}) => {
  const { 
    children = null, 
    setShow = () => {}, 
    setCheck = () => {} 
  } = props;
  
  const [socket, setSocket] = useState<Socket | undefined>();
  const [messages, setMessages] = useState<unknown[]>([]);
  const [onlineUsers] = useState<unknown>([]);
  const [relode, setRelode] = useState(false);
  const [showChat, setShowChat] = useState<boolean>(true);
  const [socketError, setSocketError] = useState<string | null>(null);





  // Initialize socket only once on mount - no dependencies to prevent loops
  useEffect(() => {
    let currentSocket: Socket | undefined;
    
    const createSocket = () => {
      const authData = window.localStorage.getItem('auth');
      if (!authData) return;
      
      try {
        const userData = JSON.parse(authData);
        const userId = userData?.user?._id;
        if (!userId) return;

        console.log('Creating socket connection for user:', userId);

        currentSocket = io('https://mazad-click-server.onrender.com', {
          query: { userId },
          transports: ['websocket', 'polling'],
          timeout: 20000,
          // Limit reconnection attempts to prevent spam
          reconnection: true,
          reconnectionAttempts: 3,
          reconnectionDelay: 2000,
          reconnectionDelayMax: 10000,
        });

        currentSocket.on('connect', () => {
          console.log('Socket connected successfully!');
          setSocketError(null);
        });

        currentSocket.on('connect_error', (error) => {
          console.error('Socket connection error:', error);
          setSocketError('Failed to connect to chat server');
        });

        currentSocket.on('sendNotificationChatCreate', (data) => {
          console.log('Create Chat from seller data = ', data);
          if (data.code === '001') {
            setShow(true);
            setCheck(true);
          }
        });

        currentSocket.on('sendMessage', (data) => {
          console.log('Message data from sendMessage event:', data);
          // Accept all messages, not just non-admin ones
          setMessages(p => {
            // Check if message already exists to avoid duplicates
            const isDuplicate = p.some((msg: any) => 
              msg._id === data._id || 
              (msg.message === data.message && 
               msg.sender === data.sender && 
               Math.abs(new Date(msg.createdAt).getTime() - new Date(data.createdAt).getTime()) < 1000)
            );
            
            if (isDuplicate) {
              console.log('Duplicate message, not adding to state');
              return p;
            }
            
            console.log('Adding message to state');
            return [...p, data];
          });
        });
        
        // Listen for adminMessage events specifically for admin-to-user communication
        currentSocket.on('adminMessage', (data) => {
          console.log('Admin message received in socket context:', data);
          // Make sure the sender is properly set to 'admin'
          const adminMessage = {
            ...data,
            sender: 'admin'
          };
          // Always accept admin messages
          setMessages(p => {
            // Check if message already exists to avoid duplicates
            const isDuplicate = p.some((msg: any) => 
              msg._id === adminMessage._id || 
              (msg.message === adminMessage.message && 
               msg.sender === 'admin' && 
               Math.abs(new Date(msg.createdAt).getTime() - new Date(adminMessage.createdAt).getTime()) < 1000)
            );
            
            if (isDuplicate) {
              console.log('Duplicate admin message, not adding to state');
              return p;
            }
            
            console.log('Adding admin message to state');
            return [...p, adminMessage];
          });
        });

        setSocket(currentSocket);
      } catch (error) {
        console.error('Error parsing auth data:', error);
        setSocketError('Invalid authentication data');
      }
    };

    // Create socket on mount
    createSocket();

    // Cleanup on unmount
    return () => {
      if (currentSocket) {
        console.log('Cleaning up socket on component unmount');
        currentSocket.disconnect();
        currentSocket = undefined;
        setSocket(undefined);
      }
    };
  }, []); // Empty dependency array - only run once

  return (
    <CreateSocket.Provider 
      value={{
        showChat,
        messages,
        setMessages,
        setShowChat,
        socket,
        onlineUsers,
        setRelode,
        socketError,
        setSocketError
      }}
    >
      {children}
    </CreateSocket.Provider>
  );
};

export default SocketProvider;