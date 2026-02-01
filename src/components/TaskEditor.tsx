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
  const formatTimeInput = (iso: string) => iso ? new Date(iso).toTimeString().slice(0, 5) : '';
  const [startTimeStr, setStartTimeStr] = useState(task?.startTime ? formatTimeInput(task.startTime) : '9:00');
  const [endTimeStr, setEndTimeStr] = useState(task?.endTime ? formatTimeInput(task.endTime) : '10:00');

  useEffect(() => {
    if (task) {
      setName(task.name);
      setDate(task.date);
      setDuration(task.estimatedDuration);
      setPriority(task.priority);
      setIsFixed(task.isFixed);
      setStartTimeStr(task.startTime ? formatTimeInput(task.startTime) : '9:00');
      setEndTimeStr(task.endTime ? formatTimeInput(task.endTime) : '10:00');
    }
  }, [task]);

  const parseTimeToISO = (dateStr: string, timeStr: string): string | null => {
    const parts = timeStr.trim().split(/[:\s：]/).map((s) => parseInt(s, 10));
    const h = parts[0];
    const m = parts[1] ?? 0;
    if (isNaN(h) || h < 0 || h > 23 || isNaN(m) || m < 0 || m > 59) return null;
    return new Date(`${dateStr}T${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:00`).toISOString();
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!name.trim()) {
      alert('请输入任务名称');
      return;
    }

    let finalDuration = duration;
    let startISO: string | undefined;
    let endISO: string | undefined;

    if (isFixed) {
      if (!startTimeStr.trim() || !endTimeStr.trim()) {
        alert('固定时间任务必须设置开始和结束时间');
        return;
      }
      const parsedStart = parseTimeToISO(date, startTimeStr);
      const parsedEnd = parseTimeToISO(date, endTimeStr);
      if (!parsedStart || !parsedEnd) {
        alert('时间格式有误，请使用 9:30 或 14:00 格式');
        return;
      }
      startISO = parsedStart;
      endISO = parsedEnd;
      const startMs = new Date(startISO).getTime();
      const endMs = new Date(endISO).getTime();
      if (endMs <= startMs) {
        alert('结束时间必须晚于开始时间');
        return;
      }
      finalDuration = Math.round((endMs - startMs) / (1000 * 60));
    }

    if (isEdit && task && onUpdate) {
      onUpdate(task.id, {
        date,
        name: name.trim(),
        estimatedDuration: finalDuration,
        priority,
        isFixed,
        startTime: startISO,
        endTime: endISO,
      });
    } else {
      onAdd({
        date,
        name: name.trim(),
        estimatedDuration: finalDuration,
        priority,
        isFixed,
        startTime: startISO,
        endTime: endISO,
      });
    }

    localStorage.setItem(STORAGE_KEY_DURATION, finalDuration.toString());
    localStorage.setItem(STORAGE_KEY_PRIORITY, priority);

    if (!isEdit) {
      setName('');
      setDate(selectedDate);
      setIsFixed(false);
      setStartTimeStr('9:00');
      setEndTimeStr('10:00');
    }
    onClose();
  };

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

          {!isFixed && (
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
          )}

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
                  type="text"
                  value={startTimeStr}
                  onChange={(e) => setStartTimeStr(e.target.value)}
                  placeholder="9:00"
                  inputMode="numeric"
                />
              </div>

              <div className="form-group">
                <label>结束时间 *</label>
                <input
                  type="text"
                  value={endTimeStr}
                  onChange={(e) => setEndTimeStr(e.target.value)}
                  placeholder="10:30"
                  inputMode="numeric"
                />
              </div>
              <p className="form-hint">直接输入时间，如 9:00、14:30</p>
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
