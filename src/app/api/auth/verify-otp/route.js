// File: buyer/src/app/api/auth/verify-otp/route.js
import { NextResponse } from 'next/server';

export async function POST(request) {
  try {
    const { phone, otp } = await request.json();
    
    // Validate input
    if (!phone || !otp) {
      return NextResponse.json(
        { success: false, message: 'Phone and OTP are required' },
        { status: 400 }
      );
    }

    // Call your backend API to verify OTP
    const backendUrl = process.env.NEXT_PUBLIC_API_URL || 'https://mazad-click-server.onrender.com';
    const response = await fetch(`${backendUrl}/otp/confirm-phone`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ 
        phone: phone,
        code: otp 
      })
    });
    
    const data = await response.json();
    
    if (response.ok) {
      return NextResponse.json({
        success: true,
        message: data.message || 'OTP verified successfully',
        user: data.user,
        tokens: data.tokens
      });
    } else {
      return NextResponse.json(
        { 
          success: false, 
          message: data.message || 'OTP verification failed' 
        }, 
        { status: response.status }
      );
    }
  } catch (error) {
    console.error('OTP verification error:', error);
    return NextResponse.json(
      { success: false, message: 'Server error during OTP verification' }, 
      { status: 500 }
    );
  }
}