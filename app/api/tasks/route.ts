import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { verifyToken } from '@/utils/auth';
import { cookies } from 'next/headers';
import { markExpiredTasks } from '@/utils/markexpirytasks';

const prisma = new PrismaClient();

async function getUserIdFromToken() {
  await markExpiredTasks()
  const cookieStore = cookies();
  const token = (await cookieStore).get('token')?.value;

  if (!token) throw new Error('No token found');

  const decoded = await verifyToken(token);
  return decoded.userId;
}

export async function GET() {
  try {
    const userId = await getUserIdFromToken();
    const tasks = await prisma.task.findMany({
      where: { userId },
    });

    return NextResponse.json(tasks);
  } catch (error: unknown) {
    return NextResponse.json({ message: 'Unauthorized', error: (error as Error).message }, { status: 401 });
  }
}

export async function POST(request: Request) {
  try {
    const userId = await getUserIdFromToken();
    const { name, expPoints, expiryDateTime, type } = await request.json();
    try {
      const task = await prisma.task.create({
        data: {
          name,
          expPoints: parseInt(expPoints),
          expiryDateTime: expiryDateTime ? new Date(expiryDateTime) : null,
          type,
          userId,
        },
      });
      return NextResponse.json(task, { status: 201 });
    } catch (error: unknown) {
      console.error('Unauthorized error:', error);
      return NextResponse.json({ message: 'Unauthorized', error: (error as Error).message }, { status: 401 });
    }
  } catch (error: unknown) {
    console.error('Unauthorized error:', error);
    return NextResponse.json({ message: 'Unauthorized', error: (error as Error).message }, { status: 401 });
  }
}


export async function DELETE(request: Request) {
  try {
    const userId = await getUserIdFromToken();
    const url = new URL(request.url);
    const id = url.searchParams.get('id');

    if (!id) {
      return NextResponse.json({ message: 'Task ID is required' }, { status: 400 });
    }

    const task = await prisma.task.findUnique({
      where: { id },
    });

    if (!task) {
      return NextResponse.json({ message: 'Task not found' }, { status: 404 });
    }

    if (task.userId !== userId) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 403 });
    }

    await prisma.task.delete({
      where: { id },
    });

    return NextResponse.json({ message: 'Task deleted successfully' }, { status: 200 });
  } catch (error: unknown) {
    console.error('Error in DELETE /api/tasks:', error);
    return NextResponse.json({ message: 'Error processing request', error: (error as Error).message }, { status: 500 });
  }
}

export async function PATCH(request: Request) {
  try {
    const userId = await getUserIdFromToken();
    const { id, ...updateData } = await request.json();

    if (!id) {
      return NextResponse.json({ message: 'Task ID is required' }, { status: 400 });
    }

    const task = await prisma.task.findUnique({
      where: { id },
    });

    if (!task) {
      return NextResponse.json({ message: 'Task not found' }, { status: 404 });
    }

    if (task.userId !== userId) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 403 });
    }

    const updatedTask = await prisma.task.update({
      where: { id },
      data: updateData,
    });

    return NextResponse.json(updatedTask, { status: 200 });
  } catch (error: unknown) {
    console.error('Error in PATCH /api/tasks:', error);
    return NextResponse.json({ message: 'Error processing request', error: (error as Error).message }, { status: 500 });
  }
}