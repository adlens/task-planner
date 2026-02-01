import { useState, useEffect, useMemo } from 'react';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  TouchSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
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
  onEdit?: (task: ScheduledTask) => void;
  onReorder?: (activeIds: string[]) => void;
  hasAnchorTime?: boolean;
}

// 长按 400ms 后激活拖拽，避免与滚动冲突
const longPressActivation = { delay: 400, tolerance: 5 };

export function TaskList({ tasks, currentTaskId, taskStartTime, onStart, onPause, onComplete, onDelete, onEdit, onReorder, hasAnchorTime = true }: TaskListProps) {
  const [showCompleted, setShowCompleted] = useState(false);
  const [elapsedTick, setElapsedTick] = useState(0);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: longPressActivation }),
    useSensor(TouchSensor, { activationConstraint: longPressActivation }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  // 进行中任务计时：每秒更新一次
  useEffect(() => {
    if (!currentTaskId || !taskStartTime) return;
    const interval = setInterval(() => setElapsedTick((n) => n + 1), 1000);
    return () => clearInterval(interval);
  }, [currentTaskId, taskStartTime]);
  
  // 分离已完成和未完成的任务
  const activeTasks = tasks.filter(t => t.status !== 'completed');
  const completedTasks = tasks.filter(t => t.status === 'completed');
  const activeIds = useMemo(() => activeTasks.map(t => t.id), [activeTasks]);

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id || !onReorder) return;
    const oldIndex = activeIds.indexOf(String(active.id));
    const newIndex = activeIds.indexOf(String(over.id));
    if (oldIndex === -1 || newIndex === -1) return;
    const newOrder = arrayMove(activeIds, oldIndex, newIndex);
    onReorder(newOrder);
  };

  if (tasks.length === 0) {
    return (
      <div className="empty-state">
        <p>还没有任务，点击右上角添加任务</p>
      </div>
    );
  }

  const renderTaskContent = (task: ScheduledTask) => {
    const isActive = currentTaskId === task.id;
    const isCompleted = task.status === 'completed';
    const hasTime = task.calculatedStartTime && task.calculatedEndTime;

    return (
      <>
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
                <button className="btn btn-pause btn-small" onClick={() => onPause(task.id)}>暂停</button>
              ) : (
                <button className="btn btn-start btn-small" onClick={() => onStart(task.id)} disabled={task.status === 'overdue' || !hasAnchorTime}>开始</button>
              )}
              <button className="btn btn-complete btn-small" onClick={() => onComplete(task.id)} disabled={!hasAnchorTime}>完成</button>
            </>
          )}
          {onEdit && (
            <button className="btn btn-edit btn-small" onClick={() => onEdit(task)}>编辑</button>
          )}
          {onDelete && (
            <button className="btn btn-delete btn-small" onClick={() => confirm(`确定要删除任务"${task.name}"吗？`) && onDelete(task.id)}>删除</button>
          )}
        </div>
      </>
    );
  };

  function SortableTaskItem({ task }: { task: ScheduledTask }) {
    const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: task.id });
    const style = { transform: CSS.Transform.toString(transform), transition };

    return (
      <div
        ref={setNodeRef}
        style={style}
        className={`task-item compact ${task.status} ${currentTaskId === task.id ? 'active' : ''} ${task.isFixed ? 'fixed' : ''} ${isDragging ? 'dragging' : ''}`}
        {...attributes}
        {...listeners}
      >
        {renderTaskContent(task)}
      </div>
    );
  }

  return (
    <div className="task-list-container">
      {/* 未完成的任务列表 - 支持长按 400ms 后拖拽调序 */}
      {activeTasks.length > 0 ? (
        onReorder ? (
          <>
            <p className="task-list-hint">长按任务可拖拽调序</p>
            <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
              <SortableContext items={activeIds} strategy={verticalListSortingStrategy}>
                <div className="task-list task-list-sortable">
                  {activeTasks.map((task) => (
                    <SortableTaskItem key={task.id} task={task} />
                  ))}
                </div>
              </SortableContext>
            </DndContext>
          </>
        ) : (
          <div className="task-list">
            {activeTasks.map((task) => (
              <div key={task.id} className={`task-item compact ${task.status} ${currentTaskId === task.id ? 'active' : ''} ${task.isFixed ? 'fixed' : ''}`}>
                {renderTaskContent(task)}
              </div>
            ))}
          </div>
        )
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
                      {onEdit && (
                        <button className="btn btn-edit btn-small" onClick={() => onEdit(task)}>编辑</button>
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
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
