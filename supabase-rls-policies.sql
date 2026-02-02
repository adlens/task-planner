-- 任务规划器：RLS 策略（上传任务到 Supabase 必须启用）
-- 在 Supabase Dashboard → SQL Editor 中执行
-- 若未启用 RLS，先执行：ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;

-- tasks 表：user_id 通常为 UUID，与 auth.uid() 一致
CREATE POLICY "users_insert_own_tasks"
  ON tasks FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "users_update_own_tasks"
  ON tasks FOR UPDATE TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "users_select_own_tasks"
  ON tasks FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "users_delete_own_tasks"
  ON tasks FOR DELETE TO authenticated
  USING (auth.uid() = user_id);

-- user_settings 表
CREATE POLICY "users_insert_own_settings"
  ON user_settings FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "users_update_own_settings"
  ON user_settings FOR UPDATE TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "users_select_own_settings"
  ON user_settings FOR SELECT TO authenticated
  USING (auth.uid() = user_id);
