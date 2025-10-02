import { NextResponse } from 'next/server';
import app from '@/config';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { currentPassword, newPassword, token } = body;

    if (!token) {
      return NextResponse.json(
        { success: false, message: 'Authentication required' },
        { status: 401 }
      );
    }

    if (!currentPassword || !newPassword) {
      return NextResponse.json(
        { success: false, message: 'All fields are required' },
        { status: 400 }
      );
    }

    // Call the real backend API
    const backendUrl = app.baseURL;
    console.log('Calling backend:', `${backendUrl}/users/change-password`);
    console.log('Token:', token ? 'Present' : 'Missing');
    
    const response = await fetch(`${backendUrl}/users/change-password`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({
        currentPassword,
        newPassword
      })
    });

    console.log('Response status:', response.status);
    const data = await response.json();
    console.log('Response data:', data);

    if (response.ok) {
      return NextResponse.json(
        { 
          success: true, 
          message: data.message || 'Password changed successfully'
        },
        { status: 200 }
      );
    } else {
      return NextResponse.json(
        { 
          success: false, 
          message: data.message || 'Failed to change password'
        },
        { status: response.status }
      );
    }
  } catch (error) {
    console.error('Error changing password:', error);
    return NextResponse.json(
      { success: false, message: 'Failed to change password' },
      { status: 500 }
    );
  }
} 