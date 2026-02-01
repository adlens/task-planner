-- 日历功能数据库迁移
-- 在 Supabase SQL Editor 中执行

-- 1. 给 tasks 表添加 date 列
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS date TEXT;

-- 2. 将已有任务的 date 设为创建日期
UPDATE tasks SET date = to_char(created_at, 'YYYY-MM-DD') WHERE date IS NULL;

-- 3. 对仍为空的情况使用当天
UPDATE tasks SET date = to_char(NOW(), 'YYYY-MM-DD') WHERE date IS NULL;

-- 4. 将 date 设为必填（需确保无 NULL）
ALTER TABLE tasks ALTER COLUMN date SET DEFAULT to_char(NOW(), 'YYYY-MM-DD');
ALTER TABLE tasks ALTER COLUMN date SET NOT NULL;

-- 5. 给 user_settings 添加 anchor_times 列
ALTER TABLE user_settings ADD COLUMN IF NOT EXISTS anchor_times JSONB DEFAULT '{}';
