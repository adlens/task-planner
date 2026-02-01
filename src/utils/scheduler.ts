import dayjs from 'dayjs';
import { Task, ScheduledTask } from '../types';
import { addMinutes, isTimeOverlap } from './timeUtils';

/**
 * Core scheduling algorithm: Duration-based task scheduling with fixed event avoidance
 */
export function scheduleTasks(
  tasks: Task[],
  anchorTime: string
): ScheduledTask[] {
  // Separate fixed and dynamic tasks
  const fixedTasks = tasks.filter(t => t.isFixed && t.startTime && t.endTime);
  const dynamicTasks = tasks.filter(t => !t.isFixed);
  
  // Sort fixed tasks by start time
  const sortedFixedTasks = [...fixedTasks].sort((a, b) => 
    dayjs(a.startTime!).diff(dayjs(b.startTime!))
  );
  
  // Sort dynamic tasks by priority (high -> medium -> low)
  const priorityOrder = { high: 3, medium: 2, low: 1 };
  const sortedDynamicTasks = [...dynamicTasks].sort((a, b) => 
    priorityOrder[b.priority] - priorityOrder[a.priority]
  );
  
  const scheduled: ScheduledTask[] = [];
  let currentTime = dayjs(anchorTime);
  
  // Process dynamic tasks
  for (const task of sortedDynamicTasks) {
    let taskStart = currentTime.toISOString();
    let taskEnd = addMinutes(taskStart, task.estimatedDuration);
    
    // Check for conflicts with fixed tasks and find the best placement
    let hasConflict = true;
    while (hasConflict) {
      const conflictingFixedTask = sortedFixedTasks.find(ft => 
        isTimeOverlap(taskStart, taskEnd, ft.startTime!, ft.endTime!)
      );
      
      if (conflictingFixedTask) {
        // Move task to after the conflicting fixed task
        taskStart = conflictingFixedTask.endTime!;
        taskEnd = addMinutes(taskStart, task.estimatedDuration);
        // Continue checking for more conflicts
      } else {
        hasConflict = false;
      }
    }
    
    scheduled.push({
      ...task,
      calculatedStartTime: taskStart,
      calculatedEndTime: taskEnd,
    });
    
    currentTime = dayjs(taskEnd);
  }
  
  // Add fixed tasks
  for (const task of sortedFixedTasks) {
    scheduled.push({
      ...task,
      calculatedStartTime: task.startTime!,
      calculatedEndTime: task.endTime!,
    });
  }
  
  // Sort all scheduled tasks by start time
  return scheduled.sort((a, b) => 
    dayjs(a.calculatedStartTime).diff(dayjs(b.calculatedStartTime))
  );
}

/**
 * Recalculate remaining tasks from a given point
 */
export function recalculateFromTime(
  tasks: Task[],
  currentTime: string,
  completedTaskIds: string[]
): ScheduledTask[] {
  // Filter out completed tasks
  const remainingTasks = tasks.filter(t => !completedTaskIds.includes(t.id));
  
  // For in-progress tasks, use actual start time
  const inProgressTask = tasks.find(t => t.status === 'in-progress');
  const anchor = inProgressTask?.actualStartTime || currentTime;
  
  return scheduleTasks(remainingTasks, anchor);
}

/**
 * Check if a task is overdue
 */
export function updateTaskStatus(task: ScheduledTask): ScheduledTask {
  const now = dayjs();
  const endTime = dayjs(task.calculatedEndTime);
  
  if (task.status === 'completed') {
    return task;
  }
  
  if (task.status === 'in-progress') {
    if (now.isAfter(endTime)) {
      return { ...task, status: 'overdue' };
    }
    return task;
  }
  
  if (now.isAfter(endTime) && task.status === 'pending') {
    return { ...task, status: 'overdue' };
  }
  
  return task;
}
