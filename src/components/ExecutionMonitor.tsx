interface ExecutionMonitorProps {
  onReset: () => void;
  hasActiveTask: boolean;
}

export function ExecutionMonitor({ onReset, hasActiveTask }: ExecutionMonitorProps) {
  return (
    <div className="execution-monitor">
      <div className="monitor-header">
        <h3>执行监控</h3>
      </div>
      
      <div className="monitor-actions">
        <button
          className="btn btn-reset"
          onClick={onReset}
          disabled={hasActiveTask}
        >
          一键同步 / 重置
        </button>
        <p className="hint">
          从当前时间起，仅对未完成任务重新排程；已完成任务释放时段，不再参与排程
        </p>
      </div>
    </div>
  );
}
