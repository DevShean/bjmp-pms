import { NextResponse } from 'next/server';

export async function POST() {
  const response = NextResponse.json({ success: true });
  
  // Clear the session cookie
  response.cookies.set('bjmp_session', '', {
    path: '/',
    expires: new Date(0),
    sameSite: 'lax',
  });

  return response;
}
