import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { verifyToken } from '@/utils/auth';

export async function middleware(request: NextRequest) {
  const token = request.cookies.get('token')?.value;

  if (!token) {
    return NextResponse.redirect(new URL('/login', request.url));
  }

  try {
    await verifyToken(token); 
    return NextResponse.next();
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  } catch (error) {
    return NextResponse.redirect(new URL('/login', request.url)); // Redirect to login if invalid token
  }
}

export const config = {
  matcher: ['/api/tasks/:path*', '/'], // Apply middleware to these routes
};
