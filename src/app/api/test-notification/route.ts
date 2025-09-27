import { NextRequest, NextResponse } from 'next/server';

export async function GET() {
  try {
    // Handle GET request for test notifications
    return NextResponse.json({ message: 'Test notifications endpoint' });
  } catch {
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    // Handle POST request for test notifications
    return NextResponse.json({ message: 'Test notification created', data: body });
  } catch {
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 