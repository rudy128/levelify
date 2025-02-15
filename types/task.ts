import { TaskType } from '@prisma/client'

export interface Task {
  id: string;
  name: string;
  expPoints: number;
  datetime: Date;
  type: TaskType;
  completed: boolean;
  status: string;
  expiryDateTime: Date;
}

export interface FormData {
  name: string;
  expPoints: string;
  expiryDateTime: string;
  // datetime: string;
  type: TaskType;
}
