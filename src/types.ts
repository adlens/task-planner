export interface Task {
  id: string;
  /** 任务所属日期 YYYY-MM-DD */
  date: string;
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
  /** 每日期锚点时间 */
  anchorTimes?: Record<string, string>;
  /** @deprecated 兼容旧数据 */
  anchorTime?: string;
}
