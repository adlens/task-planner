import { useState } from 'react';
import { useTaskPool } from './hooks/useTaskPool';
import { useAuth } from './contexts/AuthContext';
import { TaskEditor } from './components/TaskEditor';
import { TaskList } from './components/TaskList';
import { AnchorInput } from './components/AnchorInput';
import { ExecutionMonitor } from './components/ExecutionMonitor';
import { AuthModal } from './components/AuthModal';
import { DateSelector } from './components/DateSelector';
import { getTodayDate } from './utils/timeUtils';
import './App.css';

function App() {
  const { user, loading: authLoading } = useAuth();
  const [selectedDate, setSelectedDate] = useState(getTodayDate);
  
  const {
    tasks,
    anchorTime,
    scheduledTasks,
    currentTaskId,
    taskStartTime,
    syncing,
    addTask,
    deleteTask,
    reorderTasks,
    taskCountByDate,
    setAnchorTime,
    startTask,
    pauseTask,
    completeTask,
    resetAndRecalculate,
  } = useTaskPool(user?.id, selectedDate);

  const [showEditor, setShowEditor] = useState(false);
  const [showAuth, setShowAuth] = useState(false);

  return (
    <div className="app">
      <header className="app-header">
        <h1>时长驱动任务规划器</h1>
        <div className="header-actions">
          <button
            className="btn btn-sync"
            onClick={() => setShowAuth(true)}
            disabled={authLoading}
          >
            {syncing ? '同步中...' : user ? '已同步' : '登录同步'}
          </button>
          <button className="btn btn-add" onClick={() => setShowEditor(true)}>
            + 添加任务
          </button>
        </div>
      </header>

      <main className="app-main">
        <div className="left-panel">
          <AnchorInput anchorTime={anchorTime} onSetAnchor={setAnchorTime} />
          <ExecutionMonitor
            onReset={resetAndRecalculate}
            hasActiveTask={currentTaskId !== null}
          />
        </div>

        <div className="right-panel">
          <div className="schedule-header">
            <DateSelector
              selectedDate={selectedDate}
              onSelect={setSelectedDate}
              taskCountByDate={taskCountByDate}
            />
            <h2>{anchorTime ? '日程' : '任务列表'}</h2>
            {anchorTime ? (
              <p className="schedule-info">
                基于起始时间: {new Date(anchorTime).toLocaleString('zh-CN')}
              </p>
            ) : (
              <p className="schedule-info">
                请设置起始锚点以查看任务时间安排
              </p>
            )}
          </div>
          
          <TaskList
            tasks={anchorTime ? scheduledTasks : tasks.map(t => ({
              ...t,
              calculatedStartTime: t.isFixed && t.startTime ? t.startTime : '',
              calculatedEndTime: t.isFixed && t.endTime ? t.endTime : '',
            }))}
            currentTaskId={currentTaskId}
            taskStartTime={taskStartTime}
            onStart={startTask}
            onPause={pauseTask}
            onComplete={completeTask}
            onDelete={deleteTask}
            onReorder={reorderTasks}
            hasAnchorTime={!!anchorTime}
          />
        </div>
      </main>

      {showEditor && (
        <TaskEditor
          selectedDate={selectedDate}
          onAdd={addTask}
          onClose={() => setShowEditor(false)}
        />
      )}

      {showAuth && (
        <AuthModal onClose={() => setShowAuth(false)} />
      )}
    </div>
  );
}

export default App;
