import { createClient } from '@supabase/supabase-js';
import { Task } from '../types';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.warn('Supabase credentials not configured. Running in offline mode.');
}

export const supabase = supabaseUrl && supabaseAnonKey
  ? createClient(supabaseUrl, supabaseAnonKey)
  : null;

// 数据库使用 snake_case，需转换
const TASK_TO_DB: Record<string, string> = {
  estimatedDuration: 'estimated_duration',
  isFixed: 'is_fixed',
  startTime: 'start_time',
  endTime: 'end_time',
  actualStartTime: 'actual_start_time',
  actualEndTime: 'actual_end_time',
  actualDuration: 'actual_duration',
  preservedStartTime: 'preserved_start_time',
  preservedEndTime: 'preserved_end_time',
};

const DB_TO_TASK: Record<string, string> = Object.fromEntries(
  Object.entries(TASK_TO_DB).map(([k, v]) => [v, k])
);

function taskToDb(task: Task & { user_id?: string; updated_at?: string }): Record<string, unknown> {
  const row: Record<string, unknown> = { user_id: task.user_id, updated_at: task.updated_at };
  for (const [k, v] of Object.entries(task)) {
    if (k === 'user_id' || k === 'updated_at') continue;
    const col = TASK_TO_DB[k] ?? k;
    row[col] = v;
  }
  return row;
}

function dbToTask(row: Record<string, unknown>): Task {
  const task: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(row)) {
    if (['user_id', 'created_at', 'updated_at'].includes(k)) continue;
    const key = DB_TO_TASK[k] ?? k;
    task[key] = v;
  }
  return task as unknown as Task;
}

// 同步任务到云端
export async function syncTasksToCloud(userId: string, tasks: Task[]): Promise<void> {
  if (!supabase) throw new Error('云端未配置');

  const dbRows = tasks.map((task) =>
    taskToDb({
      ...task,
      user_id: userId,
      updated_at: new Date().toISOString(),
    })
  );

  const { error } = await supabase
    .from('tasks')
    .upsert(dbRows, { onConflict: 'id' });

  if (error) {
    console.error('Failed to sync tasks:', error);
    throw error;
  }
}

// 从云端获取任务
export async function fetchTasksFromCloud(userId: string): Promise<Task[]> {
  if (!supabase) return [];

  const { data, error } = await supabase
    .from('tasks')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: true });

  if (error) {
    console.error('Failed to fetch tasks:', error);
    throw error;
  }

  return (data || []).map((row) => dbToTask(row as Record<string, unknown>));
}

// 删除云端任务
export async function deleteTaskFromCloud(taskId: string): Promise<void> {
  if (!supabase) return;

  const { error } = await supabase
    .from('tasks')
    .delete()
    .eq('id', taskId);

  if (error) {
    console.error('Failed to delete task:', error);
    throw error;
  }
}

// 保存锚点时间到云端
export async function syncAnchorToCloud(userId: string, anchorTimes: Record<string, string> | undefined): Promise<void> {
  if (!supabase) throw new Error('云端未配置');

  const { error } = await supabase
    .from('user_settings')
    .upsert({
      user_id: userId,
      anchor_times: anchorTimes || {},
      updated_at: new Date().toISOString(),
    }, { onConflict: 'user_id' });

  if (error) {
    console.error('Failed to sync anchor:', error);
  }
}

// 从云端获取锚点时间
export async function fetchAnchorFromCloud(userId: string): Promise<Record<string, string> | undefined> {
  if (!supabase) return undefined;

  const { data, error } = await supabase
    .from('user_settings')
    .select('anchor_times, anchor_time')
    .eq('user_id', userId)
    .single();

  if (error && error.code !== 'PGRST116') {
    console.error('Failed to fetch anchor:', error);
  }

  if (data?.anchor_times && typeof data.anchor_times === 'object') {
    return data.anchor_times;
  }
  if (data?.anchor_time) {
    return { [new Date().toISOString().slice(0, 10)]: data.anchor_time };
  }
  return undefined;
}
