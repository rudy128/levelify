'use client';

import { useState, useEffect } from 'react';
import { Task, FormData } from '../types/task';
import { TaskType, TaskStatus } from '@prisma/client';
import { useRouter } from 'next/navigation';

export default function Home() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [formData, setFormData] = useState<FormData>({
    name: '',
    expPoints: '',
    expiryDateTime: '',
    type: TaskType.DAILY,
  });
  const [totalExp, setTotalExp] = useState(0);
  const router = useRouter();

  useEffect(() => {
    fetchTasks();
  }, []);

  const handleLogout = async () => {
    try {
      const res = await fetch('/api/auth/logout', {
        method: 'POST',
        credentials: 'include',
      });
      if (res.ok) {
        router.push('/login');
      } else {
        throw new Error('Logout failed');
      }
    } catch (error) {
      console.error('Error logging out:', error);
    }
  };
  
  const fetchTasks = async () => {
    try {
      const res = await fetch('/api/tasks', {
        method: 'GET',
        credentials: 'include',
      });
      if (!res.ok) {
        if (res.status === 401) {
          router.push('/login');
          return;
        }
        throw new Error('Failed to fetch tasks');
      }

      const data: Task[] = await res.json();

      const earnedExp = data.reduce(
        (acc, task) =>
          task.completed && task.status !== TaskStatus.FAILED ? acc + task.expPoints : acc,
        0
      );
      setTotalExp(earnedExp);
      setTasks(data);
    } catch (error) {
      console.error('Error fetching tasks:', error);
    }
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    try {
      const res = await fetch('/api/tasks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(formData),
      });
      console.log(res)
      if (!res.ok) throw new Error('Failed to create task');
      setFormData({ name: '', expPoints: '', expiryDateTime: '', type: TaskType.DAILY });
      fetchTasks();
    } catch (error) {
      console.error('Error creating task:', error);
    }
  };

  const toggleCompletion = async (task: Task) => {
    try {
      const res = await fetch('/api/tasks', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ id: task.id, completed: !task.completed }),
      });

      if (!res.ok) throw new Error('Failed to update task');
      fetchTasks();
    } catch (error) {
      console.error('Error updating task:', error);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      const res = await fetch(`/api/tasks?id=${id}`, {
        method: 'DELETE',
        credentials: 'include',
      });

      if (!res.ok) throw new Error('Failed to delete task');
      fetchTasks();
    } catch (error) {
      console.error('Error deleting task:', error);
    }
  };

  const getTaskColor = (task: Task): string => {
    if (task.status === TaskStatus.FAILED) return 'bg-red-500 text-white';
    if (task.status === TaskStatus.COMPLETED) return 'bg-green-500 text-white';
    switch (task.type) {
      case TaskType.URGENT:
        return 'bg-red-200';
      case TaskType.IMPORTANT:
        return 'bg-yellow-200';
      default:
        return 'bg-cream-100';
    }
  };

  const renderTaskList = (taskType: TaskType, title: string) => {
    const filteredTasks = tasks.filter((task) => task.type === taskType);
    return (
      <div className="mb-8">
        <h2 className="text-xl font-bold mb-4">{title}</h2>
        <ul>
          {filteredTasks.map((task) => (
            <li key={task.id} className={`mb-2 p-2 rounded ${getTaskColor(task)}`}>
              <span style={{ textDecoration: task.completed ? 'line-through' : 'none' }}>
                {task.name} - {task.expPoints} XP - Expires on:{' '}
                {task.expiryDateTime ? new Date(task.expiryDateTime).toLocaleString() : 'No expiry'}
              </span>
              <span className="ml-2">({task.status})</span>
              {task.status !== TaskStatus.FAILED && (
                <>
                  <button
                    onClick={() => toggleCompletion(task)}
                    className="ml-2 bg-blue-500 text-white p-1 rounded"
                  >
                    {task.completed ? 'Mark Uncompleted' : 'Mark Completed'}
                  </button>
                  <button
                    onClick={() => handleDelete(task.id)}
                    className="ml-2 bg-red-500 text-white p-1 rounded"
                  >
                    Delete
                  </button>
                </>
              )}
            </li>
          ))}
        </ul>
      </div>
    );
  };

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-3xl font-bold mb-4">Task Manager</h1>
      <button 
      onClick={handleLogout}
      className="bg-red-500 text-white p-2 rounded"
    >
      Logout
    </button>
      <h2 className="text-xl mb-4">Total XP: {totalExp}</h2>

      <form onSubmit={handleSubmit} className="mb-8">
        <input
          type="text"
          name="name"
          placeholder="Task name"
          value={formData.name}
          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
          className="border p-2 mr-2"
        />
        <input
          type="number"
          name="expPoints"
          placeholder="Exp points"
          value={formData.expPoints}
          onChange={(e) => setFormData({ ...formData, expPoints: e.target.value })}
          className="border p-2 mr-2"
        />
        <input
          type="datetime-local"
          name="expiryDateTime"
          value={formData.expiryDateTime}
          onChange={(e) => setFormData({ ...formData, expiryDateTime: e.target.value })}
          className="border p-2 mr-2"
        />
        <select
          name="type"
          value={formData.type}
          onChange={(e) => setFormData({ ...formData, type: e.target.value as TaskType })}
          className="border p-2 mr-2"
        >
          {Object.values(TaskType).map((type) => (
            <option key={type} value={type}>
              {type}
            </option>
          ))}
        </select>
        <button type="submit" className="bg-blue-500 text-white p-2 rounded">
          Add Task
        </button>
      </form>

      {renderTaskList(TaskType.URGENT, 'Urgent Tasks')}
      {renderTaskList(TaskType.IMPORTANT, 'Important Tasks')}
      {renderTaskList(TaskType.DAILY, 'Daily Tasks')}
      {renderTaskList(TaskType.WEEKLY, 'Weekly Tasks')}
      {renderTaskList(TaskType.MONTHLY, 'Monthly Tasks')}
    </div>
  );
}
