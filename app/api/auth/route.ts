import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';
import { generateToken } from '@/utils/auth';

const prisma = new PrismaClient();

export async function POST(req: Request) {
  const { email, password, action } = await req.json();

  if (!email || !password || !action) {
    return NextResponse.json({ message: 'Missing required fields' }, { status: 400 });
  }

  if (action === 'signup') {
    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (existingUser) {
      return NextResponse.json({ message: 'User already exists' }, { status: 400 });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const newUser = await prisma.user.create({
      data: { email, password: hashedPassword },
    });

    const token = generateToken(newUser.id);
    const response = NextResponse.json({ message: 'Signup successful', user: { id: newUser.id, email: newUser.email } });
    response.cookies.set('token', token, { httpOnly: true, maxAge: 86400 });
    return response;
  }

  if (action === 'login') {
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      return NextResponse.json({ message: 'Invalid email or password' }, { status: 401 });
    }

    const isValidPassword = await bcrypt.compare(password, user.password);
    if (!isValidPassword) {
      return NextResponse.json({ message: 'Invalid email or password' }, { status: 401 });
    }

    const token = generateToken(user.id);
    const response = NextResponse.json({ message: 'Login successful', user: { id: user.id, email: user.email } });
    response.cookies.set('token', token, { httpOnly: true, maxAge: 86400 });
    return response;
  }

  return NextResponse.json({ message: 'Invalid action' }, { status: 400 });
}
