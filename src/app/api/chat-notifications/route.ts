import { NextRequest, NextResponse } from 'next/server';
import { API_BASE_URL } from '@/config';

interface ChatUser {
  _id: string;
  firstName: string;
  lastName: string;
  avatar?: string;
}

interface Chat {
  _id: string;
  users: ChatUser[];
  createdAt: string;
}

interface Message {
  _id: string;
  message: string;
  reciver: string;
  createdAt: string;
}

interface ChatNotification {
  id: string;
  name: string;
  message: string;
  unread: number;
  time: string;
  avatar: string;
}

// This is a mock implementation. In a real application, this would connect to your backend
export async function GET() {
  return NextResponse.json({ error: 'Use POST with userId and token' }, { status: 405 });
}

export async function POST(req: NextRequest) {
  try {
    const { userId, token } = await req.json();
    if (!userId || !token) {
      return NextResponse.json({ error: 'Missing userId or token' }, { status: 400 });
    }

    // 1. Fetch all chats for the user
    const chatRes = await fetch(`${API_BASE_URL}chat/getchats`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({ id: userId, from: 'buyer' })
    });
    if (!chatRes.ok) {
      return NextResponse.json({ error: 'Failed to fetch chats' }, { status: 500 });
    }
    const chats: Chat[] = await chatRes.json();

    // 2. For each chat, fetch messages and build notification
    const notifications: ChatNotification[] = await Promise.all(
      chats.map(async (chat: Chat) => {
        const idChat = chat._id;
        const users = chat.users;
        // Find the other user
        const otherUser = users.find((u: ChatUser) => u._id !== userId) || users[0];
        // Fetch messages for this chat
        let messages: Message[] = [];
        try {
          const msgRes = await fetch(`${API_BASE_URL}message/getAll/${idChat}`);
          if (msgRes.ok) {
            messages = await msgRes.json();
          } else {
            console.error(`Failed to fetch messages for chat ${idChat}:`, msgRes.statusText);
          }
        } catch (err) {
          console.error(`Error fetching messages for chat ${idChat}:`, err);
        }
        // Find the latest message
        const latestMessage = messages.length > 0 ? messages[messages.length - 1] : null;
        // Count unread messages (if you add a 'read' flag, filter by that)
        // For now, count messages where reciver is the user
        const unread = messages.filter((m: Message) => m.reciver === userId).length;
        return {
          id: idChat,
          name: `${otherUser.firstName} ${otherUser.lastName}`,
          message: latestMessage ? latestMessage.message : '',
          unread,
          time: latestMessage ? latestMessage.createdAt : chat.createdAt,
          avatar: otherUser.avatar || '/assets/images/user-placeholder.jpg',
        };
      })
    );

    return NextResponse.json({ notifications }, { status: 200 });
  } catch (error) {
    console.error('Error fetching chat notifications:', error);
    return NextResponse.json(
      { error: 'Failed to fetch chat notifications' },
      { status: 500 }
    );
  }
} 