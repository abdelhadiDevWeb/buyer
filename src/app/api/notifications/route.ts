
import { NextRequest, NextResponse } from 'next/server';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'https://mazadclick-server.onrender.com';

export async function GET(req: NextRequest) {
  try {
    // Get the authorization header
    const authHeader = req.headers.get('authorization');
    if (!authHeader) {
      return NextResponse.json({ error: 'Authorization header required' }, { status: 401 });
    }

    // Forward the request to the backend
    const response = await fetch(`${API_BASE_URL}/notification/all`, {
      method: 'GET',
      headers: {
        'Authorization': authHeader,
        'x-access-key': process.env.NEXT_PUBLIC_KEY_API_BYUER || '',
        'Content-Type': 'application/json',
      },
      credentials: 'include',
    });

    if (!response.ok) {
      return NextResponse.json(
        { error: 'Failed to fetch notifications' }, 
        { status: response.status }
      );
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error('Error fetching notifications:', error);
    return NextResponse.json(
      { error: 'Internal server error' }, 
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    // Get the authorization header
    const authHeader = req.headers.get('authorization');
    if (!authHeader) {
      return NextResponse.json({ error: 'Authorization header required' }, { status: 401 });
    }

    // Get the request body
    const body = await req.json();
    const { userId, token } = body;

    if (!userId) {
      return NextResponse.json({ error: 'User ID is required' }, { status: 400 });
    }

    console.log('🔍 Fetching notifications for user:', userId);

    // Use the correct backend endpoint for buyer notifications
    const response = await fetch(`${API_BASE_URL}/notification/buyer/${userId}`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'x-access-key': process.env.NEXT_PUBLIC_KEY_API_BYUER || '',
        'Content-Type': 'application/json',
      },
      credentials: 'include',
    });

    if (!response.ok) {
      console.error('Backend response error:', response.status, response.statusText);
      return NextResponse.json(
        { error: 'Failed to fetch notifications' }, 
        { status: response.status }
      );
    }

    const data = await response.json();
    console.log('📥 Backend returned notifications:', data.length || 0);
    
    // Filter to only show unread notifications
    const unreadNotifications = data.filter((notification: any) => notification.read === false) || [];
    console.log('📥 Unread notifications:', unreadNotifications.length);
    
    return NextResponse.json({ notifications: unreadNotifications });
  } catch (error) {
    console.error('Error fetching notifications:', error);
    return NextResponse.json(
      { error: 'Internal server error' }, 
      { status: 500 }
    );
  }
} 