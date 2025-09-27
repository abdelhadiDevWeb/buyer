import { NextRequest, NextResponse } from 'next/server';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'https://mazad-click-server.onrender.com';

export async function GET(req: NextRequest) {
  try {
    // Get the authorization header
    const authHeader = req.headers.get('authorization');
    if (!authHeader) {
      return NextResponse.json({ error: 'Authorization header required' }, { status: 401 });
    }

    // Forward the request to the new backend endpoint that returns populated sender data
    const response = await fetch(`${API_BASE_URL}/notification/general`, {
      method: 'GET',
      headers: {
        'Authorization': authHeader,
        'x-access-key': process.env.NEXT_PUBLIC_KEY_API_BYUER || '',
        'Content-Type': 'application/json',
      },
      credentials: 'include',
    });

    if (!response.ok) {
      console.error('Backend response error:', response.status, response.statusText);
      return NextResponse.json(
        { error: 'Failed to fetch general notifications' },
        { status: response.status }
      );
    }

    const data = await response.json();
    console.log('📥 Backend returned general notifications:', data.notifications?.length || 0);
    return NextResponse.json(data);
  } catch (error) {
    console.error('Error fetching general notifications:', error);
    return NextResponse.json(
      { error: 'Internal server error' }, 
      { status: 500 }
    );
  }
}
