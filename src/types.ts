export interface Task {
  id: string;
  name: string;
  estimatedDuration: number; // in minutes
  priority: 'low' | 'medium' | 'high';
  isFixed: boolean;
  startTime?: string; // ISO string, required if isFixed
  endTime?: string; // ISO string, required if isFixed
  actualStartTime?: string; // ISO string, for tracking
  actualEndTime?: string; // ISO string, for tracking
  actualDuration?: number; // in minutes, for tracking
  status: 'pending' | 'in-progress' | 'completed' | 'overdue';
  /** 完成时保留的排程时间段，用于展示，重置后不再参与排程 */
  preservedStartTime?: string;
  preservedEndTime?: string;
}

export interface ScheduledTask extends Task {
  calculatedStartTime: string; // ISO string
  calculatedEndTime: string; // ISO string
}

export interface TaskPool {
  tasks: Task[];
  anchorTime?: string; // ISO string, the wake-up time
}
