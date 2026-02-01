import { useState, useEffect } from 'react';
import { Task } from '../types';

interface TaskEditorProps {
  selectedDate: string;
  task?: Task; // 有则编辑模式
  onAdd: (task: Omit<Task, 'id' | 'status'>) => void;
  onUpdate?: (id: string, updates: Partial<Task>) => void;
  onClose: () => void;
}

const STORAGE_KEY_DURATION = 'taskEditor_lastDuration';
const STORAGE_KEY_PRIORITY = 'taskEditor_lastPriority';

export function TaskEditor({ selectedDate, task, onAdd, onUpdate, onClose }: TaskEditorProps) {
  const isEdit = !!task;

  const getLastDuration = (): number => {
    const saved = localStorage.getItem(STORAGE_KEY_DURATION);
    return saved ? parseInt(saved, 10) : 30;
  };

  const getLastPriority = (): 'low' | 'medium' | 'high' => {
    const saved = localStorage.getItem(STORAGE_KEY_PRIORITY);
    return (saved as 'low' | 'medium' | 'high') || 'medium';
  };

  const [name, setName] = useState(task?.name ?? '');
  const [date, setDate] = useState(task?.date ?? selectedDate);
  useEffect(() => { setDate(task?.date ?? selectedDate); }, [selectedDate, task?.date]);
  const [duration, setDuration] = useState(task?.estimatedDuration ?? getLastDuration);
  const [priority, setPriority] = useState<'low' | 'medium' | 'high'>(task?.priority ?? getLastPriority);
  const [isFixed, setIsFixed] = useState(task?.isFixed ?? false);
  const [startTime, setStartTime] = useState(task?.startTime ? task.startTime.slice(0, 16) : '');
  const [endTime, setEndTime] = useState(task?.endTime ? task.endTime.slice(0, 16) : '');

  useEffect(() => {
    if (task) {
      setName(task.name);
      setDate(task.date);
      setDuration(task.estimatedDuration);
      setPriority(task.priority);
      setIsFixed(task.isFixed);
      setStartTime(task.startTime ? task.startTime.slice(0, 16) : '');
      setEndTime(task.endTime ? task.endTime.slice(0, 16) : '');
    }
  }, [task]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!name.trim()) {
      alert('请输入任务名称');
      return;
    }

    if (isFixed && (!startTime || !endTime)) {
      alert('固定时间任务必须设置开始和结束时间');
      return;
    }

    if (isEdit && task && onUpdate) {
      onUpdate(task.id, {
        date,
        name: name.trim(),
        estimatedDuration: duration,
        priority,
        isFixed,
        startTime: isFixed ? new Date(startTime).toISOString() : undefined,
        endTime: isFixed ? new Date(endTime).toISOString() : undefined,
      });
    } else {
      onAdd({
        date,
        name: name.trim(),
        estimatedDuration: duration,
        priority,
        isFixed,
        startTime: isFixed ? new Date(startTime).toISOString() : undefined,
        endTime: isFixed ? new Date(endTime).toISOString() : undefined,
      });
    }

    localStorage.setItem(STORAGE_KEY_DURATION, duration.toString());
    localStorage.setItem(STORAGE_KEY_PRIORITY, priority);

    if (!isEdit) {
      setName('');
      setDate(selectedDate);
      setIsFixed(false);
      setStartTime('');
      setEndTime('');
    }
    onClose();
  };

  const now = new Date();
  const defaultStart = new Date(now.getTime() + 60 * 60 * 1000).toISOString().slice(0, 16);
  const defaultEnd = new Date(now.getTime() + 2 * 60 * 60 * 1000).toISOString().slice(0, 16);

  return (
    <div className="task-editor-overlay" onClick={onClose}>
      <div className="task-editor" onClick={(e) => e.stopPropagation()}>
        <h2>{isEdit ? '编辑任务' : '添加任务'}</h2>
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>日期</label>
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
            />
          </div>
          <div className="form-group">
            <label>任务名称 *</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="例如：洗漱、早餐、阅读"
              required
            />
          </div>

          <div className="form-group">
            <label>预估时长（分钟）</label>
            <input
              type="number"
              value={duration}
              onChange={(e) => setDuration(parseInt(e.target.value) || 0)}
              min="1"
              required
            />
          </div>

          <div className="form-group">
            <label>优先级</label>
            <select
              value={priority}
              onChange={(e) => setPriority(e.target.value as 'low' | 'medium' | 'high')}
            >
              <option value="low">低</option>
              <option value="medium">中</option>
              <option value="high">高</option>
            </select>
          </div>

          <div className="form-group">
            <label>
              <input
                type="checkbox"
                checked={isFixed}
                onChange={(e) => setIsFixed(e.target.checked)}
              />
              固定时间任务
            </label>
          </div>

          {isFixed && (
            <>
              <div className="form-group">
                <label>开始时间 *</label>
                <input
                  type="datetime-local"
                  value={startTime || defaultStart}
                  onChange={(e) => setStartTime(e.target.value)}
                  required={isFixed}
                />
              </div>

              <div className="form-group">
                <label>结束时间 *</label>
                <input
                  type="datetime-local"
                  value={endTime || defaultEnd}
                  onChange={(e) => setEndTime(e.target.value)}
                  required={isFixed}
                />
              </div>
            </>
          )}

          <div className="form-actions">
            <button type="button" onClick={onClose}>取消</button>
            <button type="submit">{isEdit ? '保存' : '添加'}</button>
          </div>
        </form>
      </div>
    </div>
  );
}
