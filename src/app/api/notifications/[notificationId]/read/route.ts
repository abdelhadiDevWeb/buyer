import { NextRequest, NextResponse } from 'next/server';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'https://mazadclick-server.onrender.com';

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ notificationId: string }> }
) {
  try {
    const { notificationId } = await params;
    
    if (!notificationId) {
      return NextResponse.json(
        { error: 'Notification ID is required' }, 
        { status: 400 }
      );
    }

    // Get the authorization header
    const authHeader = req.headers.get('authorization');
    if (!authHeader) {
      return NextResponse.json({ error: 'Authorization header required' }, { status: 401 });
    }

    // Forward the request to the backend
    const response = await fetch(`${API_BASE_URL}/notification/${notificationId}/read`, {
      method: 'PUT',
      headers: {
        'Authorization': authHeader,
        'x-access-key': process.env.NEXT_PUBLIC_KEY_API_BYUER || '',
        'Content-Type': 'application/json',
      },
      credentials: 'include',
    });

    if (!response.ok) {
      return NextResponse.json(
        { error: 'Failed to mark notification as read' }, 
        { status: response.status }
      );
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error(`Error marking notification as read:`, error);
    return NextResponse.json(
      { error: 'Internal server error' }, 
      { status: 500 }
    );
  }
}
