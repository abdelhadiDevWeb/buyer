import { NextResponse } from 'next/server';

export async function PUT(request: Request) {
  try {
    const body = await request.json();
    const { firstName, lastName, email, phone, gender, token } = body;

    if (!token) {
      return NextResponse.json(
        { success: false, message: 'Authentication required' },
        { status: 401 }
      );
    }

    // This would normally call an actual API backend
    // For now, we'll mock a successful response
    
    // In a real implementation, you would make a request to your backend API:
    // const response = await fetch('https://your-backend-api.com/user/profile', {
    //   method: 'PUT',
    //   headers: {
    //     'Content-Type': 'application/json',
    //     'Authorization': `Bearer ${token}`
    //   },
    //   body: JSON.stringify({
    //     firstName,
    //     lastName,
    //     email,
    //     phone,
    //     gender
    //   })
    // });
    // const data = await response.json();

    // Mock successful response
    return NextResponse.json(
      { 
        success: true, 
        message: 'Profile updated successfully',
        user: {
          firstName,
          lastName,
          email,
          phone,
          gender,
          displayName: `${firstName} ${lastName}`,
          // Other fields would be preserved from the backend
        }
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Error updating profile:', error);
    return NextResponse.json(
      { success: false, message: 'Failed to update profile' },
      { status: 500 }
    );
  }
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const token = searchParams.get('token');

    if (!token) {
      return NextResponse.json(
        { success: false, message: 'Authentication required' },
        { status: 401 }
      );
    }

    // This would normally call an actual API backend
    // For now, we'll mock a successful response
    
    // In a real implementation, you would make a request to your backend API:
    // const response = await fetch('https://your-backend-api.com/user/profile', {
    //   method: 'GET',
    //   headers: {
    //     'Authorization': `Bearer ${token}`
    //   }
    // });
    // const data = await response.json();

    // Mock successful response with sample user data
    return NextResponse.json(
      { 
        success: true,
        user: {
          firstName: 'John',
          lastName: 'Doe',
          email: 'john.doe@example.com',
          phone: '+1234567890',
          gender: 'MALE',
          displayName: 'John Doe',
          rating: 4.5,
          photoURL: '/assets/images/placeholder-avatar.png',
        }
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Error fetching profile:', error);
    return NextResponse.json(
      { success: false, message: 'Failed to fetch profile' },
      { status: 500 }
    );
  }
} 