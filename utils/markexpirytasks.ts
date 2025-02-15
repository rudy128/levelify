import { PrismaClient, TaskStatus } from '@prisma/client';

const prisma = new PrismaClient();

export async function markExpiredTasks() {
    const now = new Date();
  
    const expiredTasks = await prisma.task.findMany({
      where: {
        status: TaskStatus.ACTIVE,
        expiryDateTime: { lte: now },
      },
    });
  
    for (const task of expiredTasks) {
      await prisma.task.update({
        where: { id: task.id },
        data: { status: TaskStatus.FAILED },
      });
  
      console.log(`Task ${task.id} marked as FAILED`);
    }
  }
  