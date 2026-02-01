import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import dayjs from 'dayjs';
import { Task, ScheduledTask, TaskPool } from '../types';
import { scheduleTasks, updateTaskStatus } from '../utils/scheduler';
import { getCurrentTime, getTodayDate } from '../utils/timeUtils';
import {
  syncTasksToCloud,
  fetchTasksFromCloud,
  deleteTaskFromCloud,
  syncAnchorToCloud,
  fetchAnchorFromCloud,
} from '../lib/supabase';

const STORAGE_KEY = 'taskPool';

function migrateTask(t: Task & { date?: string }): Task {
  return { ...t, date: t.date || dayjs(t.actualStartTime || t.startTime).format('YYYY-MM-DD') || getTodayDate() };
}

export function useTaskPool(userId?: string, selectedDate?: string) {
  const [allTasks, setAllTasks] = useState<Task[]>([]);
  const [anchorTimes, setAnchorTimes] = useState<Record<string, string>>({});
  const [scheduledTasks, setScheduledTasks] = useState<ScheduledTask[]>([]);
  const [currentTaskId, setCurrentTaskId] = useState<string | null>(null);
  const [taskStartTime, setTaskStartTime] = useState<string | null>(null);
  const [syncing, setSyncing] = useState(false);
  const [lastSyncTime, setLastSyncTime] = useState<string | null>(null);
  
  const isInitialized = useRef(false);
  const pendingDeletes = useRef<string[]>([]);
  const tasksRef = useRef<Task[]>([]);
  const lastRecalcAnchor = useRef<string | undefined>();

  const date = selectedDate || getTodayDate();
  const tasks = useMemo(() => allTasks.filter(t => t.date === date), [allTasks, date]);
  const anchorTime = anchorTimes[date];

  const setAnchorTime = useCallback((anchor: string | undefined) => {
    setAnchorTimes(prev => anchor ? { ...prev, [date]: anchor } : (() => { const { [date]: _, ...r } = prev; return r; })());
  }, [date]);

  // Load from localStorage on mount
  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      try {
        const pool: TaskPool & { tasks?: (Task & { date?: string })[] } = JSON.parse(saved);
        const rawTasks = pool.tasks || [];
        const migrated = rawTasks.map(migrateTask);
        setAllTasks(migrated);
        if (pool.anchorTimes) {
          setAnchorTimes(pool.anchorTimes);
        } else if (pool.anchorTime) {
          const d = rawTasks[0] ? migrateTask(rawTasks[0]).date : getTodayDate();
          setAnchorTimes({ [d]: pool.anchorTime });
        }
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
        const [cloudTasks, cloudAnchorTimes] = await Promise.all([
          fetchTasksFromCloud(userId),
          fetchAnchorFromCloud(userId),
        ]);

        if (cloudTasks.length > 0) {
          setAllTasks(cloudTasks.map(migrateTask));
        }
        if (cloudAnchorTimes && typeof cloudAnchorTimes === 'object') {
          setAnchorTimes(cloudAnchorTimes);
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

  // Save to localStorage
  useEffect(() => {
    if (!isInitialized.current) return;
    const pool: TaskPool = { tasks: allTasks, anchorTimes };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(pool));
  }, [allTasks, anchorTimes]);

  // Sync to cloud
  useEffect(() => {
    if (!userId || !isInitialized.current) return;

    const syncTimeout = setTimeout(async () => {
      try {
        for (const taskId of pendingDeletes.current) {
          await deleteTaskFromCloud(taskId);
        }
        pendingDeletes.current = [];
        await Promise.all([
          syncTasksToCloud(userId, allTasks),
          syncAnchorToCloud(userId, anchorTimes),
        ]);
        setLastSyncTime(new Date().toISOString());
      } catch (error) {
        console.error('Failed to sync to cloud:', error);
      }
    }, 1000);

    return () => clearTimeout(syncTimeout);
  }, [userId, allTasks, anchorTimes]);

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

      return result; // 保持任务顺序，不按时间重排（支持拖拽调序）
    });
  }, [tasks, anchorTime]);

  // Periodically update task statuses (check for overdue)
  useEffect(() => {
    const interval = setInterval(() => {
      setScheduledTasks(prev => prev.map(updateTaskStatus));
    }, 60000); // Check every minute

    return () => clearInterval(interval);
  }, []);

  const addTask = useCallback((task: Omit<Task, 'id' | 'status'>) => {
    const newTask: Task = {
      ...task,
      date: task.date || date,
      id: crypto.randomUUID(),
      status: 'pending',
    };
    setAllTasks(prev => [...prev, newTask]);
  }, [date]);

  const updateTask = useCallback((id: string, updates: Partial<Task>) => {
    setAllTasks(prev => prev.map(t => t.id === id ? { ...t, ...updates } : t));
  }, []);

  const reorderTasks = useCallback((activeIds: string[]) => {
    setAllTasks(prev => {
      const forDate = prev.filter(t => t.date === date);
      const byId = new Map(forDate.map(t => [t.id, t]));
      const ordered: Task[] = activeIds.map(id => byId.get(id)).filter((t): t is Task => !!t);
      const otherDates = prev.filter(t => t.date !== date);
      return [...ordered, ...otherDates];
    });
  }, [date]);

  const deleteTask = useCallback((id: string) => {
    setAllTasks(prev => prev.filter(t => t.id !== id));
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

  const completeTask = useCallback((id: string) => {
    const now = getCurrentTime();
    const task = allTasks.find(t => t.id === id);
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
  }, [allTasks, scheduledTasks, updateTask]);

  const resetAndRecalculate = useCallback(() => {
    const now = getCurrentTime();
    
    setAllTasks(prev => prev.map(t => {
      if (t.date === date && t.status === 'in-progress') {
        return { ...t, status: 'pending' };
      }
      return t;
    }));
    
    setAnchorTime(now);
    setCurrentTaskId(null);
    setTaskStartTime(null);
  }, [date, setAnchorTime]);

  const taskCountByDate = useMemo(() => {
    const counts: Record<string, number> = {};
    for (const t of allTasks) {
      counts[t.date] = (counts[t.date] || 0) + 1;
    }
    return counts;
  }, [allTasks]);

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
    reorderTasks,
    setAnchorTime,
    startTask,
    pauseTask,
    completeTask,
    resetAndRecalculate,
    taskCountByDate,
  };
}
