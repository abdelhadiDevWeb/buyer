import { NextRequest, NextResponse } from 'next/server';
import app from '@/config';

const API_BASE_URL = app.baseURL;

// Helper function to check if backend is accessible
async function checkBackendHealth() {
  try {
    console.log('🔍 Checking backend health at:', `${API_BASE_URL}/chat/admin-chats`);
    
    // Try to access a simple endpoint that should exist
    const response = await fetch(`${API_BASE_URL}/chat/admin-chats`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'x-access-key': process.env.NEXT_PUBLIC_KEY_API_BYUER || '',
      },
    });
    
    console.log('📡 Health check response status:', response.status);
    
    // Even if it returns 401 (unauthorized), it means the server is running
    if (response.status === 404) {
      console.log('❌ Backend endpoint not found (404)');
      return false;
    }
    
    console.log('✅ Backend is accessible');
    return true;
  } catch (error) {
    console.error('❌ Backend health check failed:', error);
    const errObj = (error && typeof error === 'object') ? (error as any) : {};
    console.error('❌ Error details:', {
      message: 'message' in errObj ? String(errObj.message) : undefined,
      code: 'code' in errObj ? errObj.code : undefined,
      errno: 'errno' in errObj ? errObj.errno : undefined,
    });
    return false;
  }
}

export async function GET(req: NextRequest) {
  try {
    console.log('🔍 GET /api/chats called');
    
    // Check if backend is accessible
    const isBackendHealthy = await checkBackendHealth();
    if (!isBackendHealthy) {
      console.log('❌ Backend server is not accessible');
      return NextResponse.json({ 
        error: 'Backend server is not accessible. Please ensure the server is running on port 3000.' 
      }, { status: 503 });
    }
    
    // Get the authorization header
    const authHeader = req.headers.get('authorization');
    if (!authHeader) {
      console.log('❌ No authorization header');
      return NextResponse.json({ error: 'Authorization header required' }, { status: 401 });
    }

    console.log('🔄 Forwarding to backend:', `${API_BASE_URL}/chat/admin-chats`);
    
    // Forward the request to the backend admin-chats endpoint
    const response = await fetch(`${API_BASE_URL}/chat/admin-chats`, {
      method: 'GET',
      headers: {
        'Authorization': authHeader,
        'x-access-key': process.env.NEXT_PUBLIC_KEY_API_BYUER || '',
        'Content-Type': 'application/json',
      },
      credentials: 'include',
    });

    console.log('📡 Backend response status:', response.status);
    
    if (!response.ok) {
      const errorText = await response.text();
      console.log('❌ Backend error:', errorText);
      return NextResponse.json(
        { error: 'Failed to fetch admin chats', details: errorText }, 
        { status: response.status }
      );
    }

    const data = await response.json();
    console.log('✅ Backend response data:', data);
    return NextResponse.json(data);
  } catch (error) {
    console.error('❌ Error fetching admin chats:', error);
    const errObj = (error && typeof error === 'object') ? (error as any) : {};
    const details = 'message' in errObj ? String(errObj.message) : 'Unknown error';
    return NextResponse.json(
      { error: 'Internal server error', details }, 
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    console.log('📞 POST /api/chats called');
    
    // Check if backend is accessible
    const isBackendHealthy = await checkBackendHealth();
    if (!isBackendHealthy) {
      console.log('❌ Backend server is not accessible');
      return NextResponse.json({ 
        error: 'Backend server is not accessible. Please ensure the server is running on port 3000.' 
      }, { status: 503 });
    }
    
    // Get the authorization header
    const authHeader = req.headers.get('authorization');
    if (!authHeader) {
      console.log('❌ No authorization header');
      return NextResponse.json({ error: 'Authorization header required' }, { status: 401 });
    }

    // Get the request body
    const body = await req.json();
    console.log('📦 Request body:', body);

    // Forward the request to the backend getchats endpoint
    console.log('🔄 Forwarding to backend:', `${API_BASE_URL}/chat/getchats`);
    const response = await fetch(`${API_BASE_URL}/chat/getchats`, {
      method: 'POST',
      headers: {
        'Authorization': authHeader,
        'x-access-key': process.env.NEXT_PUBLIC_KEY_API_BYUER || '',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
      credentials: 'include',
    });

    console.log('📡 Backend response status:', response.status);
    
    if (!response.ok) {
      const errorText = await response.text();
      console.log('❌ Backend error:', errorText);
      return NextResponse.json(
        { error: 'Failed to fetch chats', details: errorText }, 
        { status: response.status }
      );
    }

    const data = await response.json();
    console.log('✅ Backend response data:', data);
    return NextResponse.json(data);
  } catch (error) {
    console.error('❌ Error fetching chats:', error);
    const errObj = (error && typeof error === 'object') ? (error as any) : {};
    const details = 'message' in errObj ? String(errObj.message) : 'Unknown error';
    return NextResponse.json(
      { error: 'Internal server error', details }, 
      { status: 500 }
    );
  }
}
