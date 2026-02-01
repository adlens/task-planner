import { useState, useEffect } from 'react';
import { Task } from '../types';

interface TaskEditorProps {
  selectedDate: string;
  onAdd: (task: Omit<Task, 'id' | 'status'>) => void;
  onClose: () => void;
}

const STORAGE_KEY_DURATION = 'taskEditor_lastDuration';
const STORAGE_KEY_PRIORITY = 'taskEditor_lastPriority';

export function TaskEditor({ selectedDate, onAdd, onClose }: TaskEditorProps) {
  // Load last values from localStorage on mount
  const getLastDuration = (): number => {
    const saved = localStorage.getItem(STORAGE_KEY_DURATION);
    return saved ? parseInt(saved, 10) : 30;
  };

  const getLastPriority = (): 'low' | 'medium' | 'high' => {
    const saved = localStorage.getItem(STORAGE_KEY_PRIORITY);
    return (saved as 'low' | 'medium' | 'high') || 'medium';
  };

  const [name, setName] = useState('');
  const [date, setDate] = useState(selectedDate);
  useEffect(() => { setDate(selectedDate); }, [selectedDate]);
  const [duration, setDuration] = useState(getLastDuration);
  const [priority, setPriority] = useState<'low' | 'medium' | 'high'>(getLastPriority);
  const [isFixed, setIsFixed] = useState(false);
  const [startTime, setStartTime] = useState('');
  const [endTime, setEndTime] = useState('');

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

    onAdd({
      date,
      name: name.trim(),
      estimatedDuration: duration,
      priority,
      isFixed,
      startTime: isFixed ? new Date(startTime).toISOString() : undefined,
      endTime: isFixed ? new Date(endTime).toISOString() : undefined,
    });

    // Save current values to localStorage for next time
    localStorage.setItem(STORAGE_KEY_DURATION, duration.toString());
    localStorage.setItem(STORAGE_KEY_PRIORITY, priority);

    // Reset form (but keep duration and priority for next time)
    setName('');
    setDate(selectedDate);
    setIsFixed(false);
    setStartTime('');
    setEndTime('');
    onClose();
  };

  const now = new Date();
  const defaultStart = new Date(now.getTime() + 60 * 60 * 1000).toISOString().slice(0, 16);
  const defaultEnd = new Date(now.getTime() + 2 * 60 * 60 * 1000).toISOString().slice(0, 16);

  return (
    <div className="task-editor-overlay" onClick={onClose}>
      <div className="task-editor" onClick={(e) => e.stopPropagation()}>
        <h2>添加任务</h2>
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
            <button type="submit">添加</button>
          </div>
        </form>
      </div>
    </div>
  );
}
