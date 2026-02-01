import { formatDateDisplay, getTodayDate } from '../utils/timeUtils';

interface DateSelectorProps {
  selectedDate: string;
  onSelect: (date: string) => void;
  taskCountByDate?: Record<string, number>;
}

export function DateSelector({ selectedDate, onSelect, taskCountByDate = {} }: DateSelectorProps) {
  const today = getTodayDate();

  const goPrev = () => {
    const d = new Date(selectedDate);
    d.setDate(d.getDate() - 1);
    onSelect(d.toISOString().slice(0, 10));
  };

  const goNext = () => {
    const d = new Date(selectedDate);
    d.setDate(d.getDate() + 1);
    onSelect(d.toISOString().slice(0, 10));
  };

  const goToday = () => {
    onSelect(today);
  };

  return (
    <div className="date-selector">
      <button type="button" className="date-nav-btn" onClick={goPrev} aria-label="前一天">
        ‹
      </button>
      <button
        type="button"
        className={`date-display ${selectedDate === today ? 'today' : ''}`}
        onClick={() => {
          const input = document.createElement('input');
          input.type = 'date';
          input.value = selectedDate;
          input.onchange = () => input.value && onSelect(input.value);
          input.click();
        }}
      >
        <span className="date-text">{formatDateDisplay(selectedDate)}</span>
        {taskCountByDate[selectedDate] != null && taskCountByDate[selectedDate] > 0 && (
          <span className="date-count">{taskCountByDate[selectedDate]}</span>
        )}
      </button>
      <button type="button" className="date-nav-btn" onClick={goNext} aria-label="后一天">
        ›
      </button>
      {selectedDate !== today && (
        <button type="button" className="date-today-btn" onClick={goToday}>
          今天
        </button>
      )}
    </div>
  );
}
