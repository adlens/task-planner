import { useState, useEffect } from 'react';
import { ScheduledTask } from '../types';
import { formatTimeRange, formatElapsed } from '../utils/timeUtils';

interface TaskListProps {
  tasks: ScheduledTask[];
  currentTaskId: string | null;
  taskStartTime: string | null;
  onStart: (id: string) => void;
  onPause: (id: string) => void;
  onComplete: (id: string) => void;
  onDelete?: (id: string) => void;
  hasAnchorTime?: boolean;
}

export function TaskList({ tasks, currentTaskId, taskStartTime, onStart, onPause, onComplete, onDelete, hasAnchorTime = true }: TaskListProps) {
  const [showCompleted, setShowCompleted] = useState(false);
  const [elapsedTick, setElapsedTick] = useState(0);

  // 进行中任务计时：每秒更新一次
  useEffect(() => {
    if (!currentTaskId || !taskStartTime) return;
    const interval = setInterval(() => setElapsedTick((n) => n + 1), 1000);
    return () => clearInterval(interval);
  }, [currentTaskId, taskStartTime]);
  
  // 分离已完成和未完成的任务
  const activeTasks = tasks.filter(t => t.status !== 'completed');
  const completedTasks = tasks.filter(t => t.status === 'completed');

  if (tasks.length === 0) {
    return (
      <div className="empty-state">
        <p>还没有任务，点击右上角添加任务</p>
      </div>
    );
  }

  const renderTask = (task: ScheduledTask) => {
    const isActive = currentTaskId === task.id;
    const isCompleted = task.status === 'completed';
    const hasTime = task.calculatedStartTime && task.calculatedEndTime;
    
    return (
      <div
        key={task.id}
        className={`task-item compact ${task.status} ${isActive ? 'active' : ''} ${task.isFixed ? 'fixed' : ''}`}
      >
        <div className="task-main">
          <div className="task-name">{task.name}</div>
          <div className="task-row">
            <div className="task-meta">
              {hasTime && hasAnchorTime ? (
                <span className="time-range">
                  {formatTimeRange(task.calculatedStartTime, task.calculatedEndTime)}
                </span>
              ) : task.isFixed && task.startTime && task.endTime ? (
                <span className="time-range">
                  {formatTimeRange(task.startTime, task.endTime)}
                </span>
              ) : null}
              <span className="duration">{task.estimatedDuration} 分钟</span>
              {isActive && taskStartTime && (
                <span className="elapsed-timer" data-tick={elapsedTick}>已进行 {formatElapsed(taskStartTime)}</span>
              )}
              {task.actualDuration != null && task.actualDuration !== task.estimatedDuration && (
                <span className="actual-duration">（实际: {task.actualDuration} 分钟）</span>
              )}
            </div>
            <div className="task-badges">
            {task.isFixed && <span className="badge fixed">固定</span>}
            <span className={`badge priority ${task.priority}`}>
              {task.priority === 'high' ? '高' : task.priority === 'medium' ? '中' : '低'}
            </span>
            {!isCompleted && task.status !== 'pending' && (
              <span className={`badge status ${task.status}`}>
                {task.status === 'in-progress' ? '进行中' :
                 task.status === 'overdue' ? '已逾期' : ''}
              </span>
            )}
            </div>
          </div>
        </div>

        <div className="task-actions">
          {!isCompleted && (
            <>
              {isActive ? (
                <button
                  className="btn btn-pause btn-small"
                  onClick={() => onPause(task.id)}
                >
                  暂停
                </button>
              ) : (
                <button
                  className="btn btn-start btn-small"
                  onClick={() => onStart(task.id)}
                  disabled={task.status === 'overdue' || !hasAnchorTime}
                >
                  开始
                </button>
              )}
              <button
                className="btn btn-complete btn-small"
                onClick={() => onComplete(task.id)}
                disabled={!hasAnchorTime}
              >
                完成
              </button>
            </>
          )}
          {onDelete && (
            <button
              className="btn btn-delete btn-small"
              onClick={() => {
                if (confirm(`确定要删除任务"${task.name}"吗？`)) {
                  onDelete(task.id);
                }
              }}
            >
              删除
            </button>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="task-list-container">
      {/* 未完成的任务列表 */}
      {activeTasks.length > 0 ? (
        <div className="task-list">
          {activeTasks.map(renderTask)}
        </div>
      ) : (
        <div className="empty-state">
          <p>所有任务都已完成！</p>
        </div>
      )}

      {/* 已完成的任务区域 */}
      {completedTasks.length > 0 && (
        <div className="completed-section">
          <button
            className="completed-toggle"
            onClick={() => setShowCompleted(!showCompleted)}
          >
            <span>已完成 ({completedTasks.length})</span>
            <span className="toggle-icon">{showCompleted ? '▼' : '▶'}</span>
          </button>
          {showCompleted && (
            <div className="completed-task-list">
              {completedTasks.map((task) => {
                const hasTime = task.calculatedStartTime && task.calculatedEndTime;
                return (
                  <div
                    key={task.id}
                    className="task-item compact completed"
                  >
                    <div className="task-main">
                      <div className="task-name">{task.name}</div>
                      <div className="task-row">
                        <div className="task-meta">
                          {hasTime && hasAnchorTime ? (
                            <span className="time-range">
                              {formatTimeRange(task.calculatedStartTime, task.calculatedEndTime)}
                            </span>
                          ) : task.isFixed && task.startTime && task.endTime ? (
                            <span className="time-range">
                              {formatTimeRange(task.startTime, task.endTime)}
                            </span>
                          ) : null}
                          <span className="duration">{task.estimatedDuration} 分钟</span>
                          {task.actualDuration && task.actualDuration !== task.estimatedDuration && (
                            <span className="actual-duration">（实际: {task.actualDuration} 分钟）</span>
                          )}
                        </div>
                        <div className="task-badges">
                          {task.isFixed && <span className="badge fixed">固定</span>}
                          <span className="badge status completed">已完成</span>
                        </div>
                      </div>
                    </div>
                    <div className="task-actions">
                      {onDelete && (
                        <button
                          className="btn btn-delete btn-small"
                          onClick={() => {
                            if (confirm(`确定要删除任务"${task.name}"吗？`)) {
                              onDelete(task.id);
                            }
                          }}
                        >
                          删除
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
