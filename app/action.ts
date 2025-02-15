'use server'

import { markExpiredTasks } from '@/utils/markexpirytasks';

export async function runExpiredTasksCheck() {
  await markExpiredTasks();
}