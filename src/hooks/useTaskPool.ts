import { useState, useEffect, useCallback, useRef } from 'react';
import dayjs from 'dayjs';
import { Task, ScheduledTask, TaskPool } from '../types';
import { scheduleTasks, updateTaskStatus } from '../utils/scheduler';
import { getCurrentTime } from '../utils/timeUtils';
import {
  syncTasksToCloud,
  fetchTasksFromCloud,
  deleteTaskFromCloud,
  syncAnchorToCloud,
  fetchAnchorFromCloud,
} from '../lib/supabase';

const STORAGE_KEY = 'taskPool';

export function useTaskPool(userId?: string) {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [anchorTime, setAnchorTime] = useState<string | undefined>();
  const [scheduledTasks, setScheduledTasks] = useState<ScheduledTask[]>([]);
  const [currentTaskId, setCurrentTaskId] = useState<string | null>(null);
  const [taskStartTime, setTaskStartTime] = useState<string | null>(null);
  const [syncing, setSyncing] = useState(false);
  const [lastSyncTime, setLastSyncTime] = useState<string | null>(null);
  
  const isInitialized = useRef(false);
  const pendingDeletes = useRef<string[]>([]);
  const tasksRef = useRef<Task[]>([]);
  const lastRecalcAnchor = useRef<string | undefined>();

  // Load from localStorage on mount
  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      try {
        const pool: TaskPool = JSON.parse(saved);
        setTasks(pool.tasks || []);
        setAnchorTime(pool.anchorTime);
      } catch (e) {
        console.error('Failed to load task pool:', e);
      }
    }
    isInitialized.current = true;
  }, []);

  // Fetch from cloud when user logs in
  useEffect(() => {
    if (!userId || !isInitialized.current) return;

    const fetchFromCloud = async () => {
      setSyncing(true);
      try {
        const [cloudTasks, cloudAnchor] = await Promise.all([
          fetchTasksFromCloud(userId),
          fetchAnchorFromCloud(userId),
        ]);

        // 合并策略：云端数据优先（如果有的话）
        if (cloudTasks.length > 0) {
          setTasks(cloudTasks);
        }
        if (cloudAnchor) {
          setAnchorTime(cloudAnchor);
        }
        setLastSyncTime(new Date().toISOString());
      } catch (error) {
        console.error('Failed to fetch from cloud:', error);
      } finally {
        setSyncing(false);
      }
    };

    fetchFromCloud();
  }, [userId]);

  // Save to localStorage whenever tasks or anchorTime changes
  useEffect(() => {
    if (!isInitialized.current) return;
    const pool: TaskPool = { tasks, anchorTime };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(pool));
  }, [tasks, anchorTime]);

  // Sync to cloud when tasks or anchorTime changes (debounced)
  useEffect(() => {
    if (!userId || !isInitialized.current) return;

    const syncTimeout = setTimeout(async () => {
      try {
        // 处理待删除的任务
        for (const taskId of pendingDeletes.current) {
          await deleteTaskFromCloud(taskId);
        }
        pendingDeletes.current = [];

        // 同步任务和锚点
        await Promise.all([
          syncTasksToCloud(userId, tasks),
          syncAnchorToCloud(userId, anchorTime),
        ]);
        setLastSyncTime(new Date().toISOString());
      } catch (error) {
        console.error('Failed to sync to cloud:', error);
      }
    }, 1000); // 1秒防抖

    return () => clearTimeout(syncTimeout);
  }, [userId, tasks, anchorTime]);

  tasksRef.current = tasks;

  // 仅在锚点变化时（首次设置或点击重置）重新计算排程
  useEffect(() => {
    if (!anchorTime) {
      setScheduledTasks([]);
      lastRecalcAnchor.current = undefined;
      return;
    }
    if (anchorTime === lastRecalcAnchor.current) return;
    lastRecalcAnchor.current = anchorTime;

    const currentTasks = tasksRef.current;
    if (currentTasks.length === 0) {
      setScheduledTasks([]);
      return;
    }

    const uncompletedTasks = currentTasks.filter(t => t.status !== 'completed');
    const completedTasks = currentTasks.filter(t => t.status === 'completed');

    const newScheduled = uncompletedTasks.length > 0
      ? scheduleTasks(uncompletedTasks, anchorTime).map(updateTaskStatus)
      : [];

    const completedScheduled: ScheduledTask[] = completedTasks.map(t => ({
      ...t,
      calculatedStartTime: t.preservedStartTime ?? t.actualStartTime ?? t.startTime ?? '',
      calculatedEndTime: t.preservedEndTime ?? t.actualEndTime ?? t.endTime ?? '',
    }));

    const merged = [...newScheduled, ...completedScheduled].sort((a, b) =>
      dayjs(a.calculatedStartTime).diff(dayjs(b.calculatedStartTime))
    );
    setScheduledTasks(merged);
  }, [anchorTime]);

  // 任务变化时只做增量更新，不重新计算时间（保留上次同步时的排程）
  useEffect(() => {
    if (!anchorTime) return;

    setScheduledTasks(prev => {
      const prevMap = new Map(prev.map(t => [t.id, t]));

      const completedTasks = tasks.filter(t => t.status === 'completed');
      const activeTasks = tasks.filter(t => t.status !== 'completed');

      const result: ScheduledTask[] = [];

      for (const task of activeTasks) {
        const existing = prevMap.get(task.id);
        if (existing) {
          result.push({ ...existing, ...task, calculatedStartTime: existing.calculatedStartTime, calculatedEndTime: existing.calculatedEndTime });
        } else {
          const lastEnd = prev.length > 0
            ? prev.reduce((latest, t) => dayjs(t.calculatedEndTime).isAfter(latest) ? dayjs(t.calculatedEndTime) : latest, dayjs(anchorTime))
            : dayjs(anchorTime);
          const start = lastEnd.toISOString();
          const end = dayjs(start).add(task.estimatedDuration, 'minute').toISOString();
          result.push({
            ...task,
            calculatedStartTime: start,
            calculatedEndTime: end,
          } as ScheduledTask);
        }
      }

      for (const task of completedTasks) {
        const existing = prevMap.get(task.id);
        if (existing) {
          result.push({ ...existing, ...task, calculatedStartTime: existing.calculatedStartTime, calculatedEndTime: existing.calculatedEndTime });
        } else {
          result.push({
            ...task,
            calculatedStartTime: task.preservedStartTime ?? task.actualStartTime ?? task.startTime ?? '',
            calculatedEndTime: task.preservedEndTime ?? task.actualEndTime ?? task.endTime ?? '',
          } as ScheduledTask);
        }
      }

      return result.sort((a, b) =>
        dayjs(a.calculatedStartTime).diff(dayjs(b.calculatedStartTime))
      );
    });
  }, [tasks, anchorTime]);

  // Periodically update task statuses (check for overdue)
  useEffect(() => {
    const interval = setInterval(() => {
      setScheduledTasks(prev => prev.map(updateTaskStatus));
    }, 60000); // Check every minute

    return () => clearInterval(interval);
  }, []);

  const addTask = (task: Omit<Task, 'id' | 'status'>) => {
    const newTask: Task = {
      ...task,
      id: crypto.randomUUID(),
      status: 'pending',
    };
    setTasks([...tasks, newTask]);
  };

  const updateTask = (id: string, updates: Partial<Task>) => {
    setTasks(tasks.map(t => t.id === id ? { ...t, ...updates } : t));
  };

  const deleteTask = useCallback((id: string) => {
    setTasks(prev => prev.filter(t => t.id !== id));
    pendingDeletes.current.push(id);
    if (currentTaskId === id) {
      setCurrentTaskId(null);
      setTaskStartTime(null);
    }
  }, [currentTaskId]);

  const startTask = (id: string) => {
    const now = getCurrentTime();
    setCurrentTaskId(id);
    setTaskStartTime(now);
    updateTask(id, {
      status: 'in-progress',
      actualStartTime: now,
    });
  };

  const pauseTask = (id: string) => {
    if (currentTaskId === id && taskStartTime) {
      const now = getCurrentTime();
      const actualDuration = Math.round(
        (dayjs(now).diff(dayjs(taskStartTime)) / (1000 * 60))
      );
      updateTask(id, {
        actualDuration,
        actualEndTime: now,
      });
      setCurrentTaskId(null);
      setTaskStartTime(null);
    }
  };

  const completeTask = (id: string) => {
    const now = getCurrentTime();
    const task = tasks.find(t => t.id === id);
    const scheduledTask = scheduledTasks.find(s => s.id === id);
    if (task) {
      const actualDuration = task.actualDuration || task.estimatedDuration;
      updateTask(id, {
        status: 'completed',
        actualEndTime: now,
        actualDuration,
        preservedStartTime: scheduledTask?.calculatedStartTime,
        preservedEndTime: scheduledTask?.calculatedEndTime,
      });
    }
    setCurrentTaskId(null);
    setTaskStartTime(null);
  };

  const resetAndRecalculate = () => {
    const now = getCurrentTime();
    
    // Reset in-progress tasks to pending
    setTasks(tasks.map(t => {
      if (t.status === 'in-progress') {
        return { ...t, status: 'pending' };
      }
      return t;
    }));
    
    // Update anchor time to now - this will trigger recalculation via useEffect
    setAnchorTime(now);
    
    // Clear current task tracking
    setCurrentTaskId(null);
    setTaskStartTime(null);
  };

  return {
    tasks,
    anchorTime,
    scheduledTasks,
    currentTaskId,
    taskStartTime,
    syncing,
    lastSyncTime,
    addTask,
    updateTask,
    deleteTask,
    setAnchorTime,
    startTask,
    pauseTask,
    completeTask,
    resetAndRecalculate,
  };
}
