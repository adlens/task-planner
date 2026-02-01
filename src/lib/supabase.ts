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

// 数据库中的任务表结构
export interface DbTask extends Omit<Task, 'id'> {
  id: string;
  user_id: string;
  created_at?: string;
  updated_at?: string;
}

// 同步任务到云端
export async function syncTasksToCloud(userId: string, tasks: Task[]): Promise<void> {
  if (!supabase) return;
  
  const dbTasks: DbTask[] = tasks.map(task => ({
    ...task,
    user_id: userId,
    updated_at: new Date().toISOString(),
  }));

  const { error } = await supabase
    .from('tasks')
    .upsert(dbTasks, { onConflict: 'id' });

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

  return (data || []).map(({ user_id, created_at, updated_at, ...task }) => task as Task);
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
export async function syncAnchorToCloud(userId: string, anchorTime: string | undefined): Promise<void> {
  if (!supabase) return;

  const { error } = await supabase
    .from('user_settings')
    .upsert({
      user_id: userId,
      anchor_time: anchorTime,
      updated_at: new Date().toISOString(),
    }, { onConflict: 'user_id' });

  if (error) {
    console.error('Failed to sync anchor:', error);
  }
}

// 从云端获取锚点时间
export async function fetchAnchorFromCloud(userId: string): Promise<string | undefined> {
  if (!supabase) return undefined;

  const { data, error } = await supabase
    .from('user_settings')
    .select('anchor_time')
    .eq('user_id', userId)
    .single();

  if (error && error.code !== 'PGRST116') { // PGRST116 = no rows
    console.error('Failed to fetch anchor:', error);
  }

  return data?.anchor_time || undefined;
}
