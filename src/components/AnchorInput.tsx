import { formatTime } from '../utils/timeUtils';
import dayjs from 'dayjs';

interface AnchorInputProps {
  anchorTime?: string;
  onSetAnchor: (time: string) => void;
}

export function AnchorInput({ anchorTime, onSetAnchor }: AnchorInputProps) {
  const handleQuickSet = () => {
    const now = dayjs().toISOString();
    onSetAnchor(now);
  };

  const handleCustomSet = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.value) {
      const time = dayjs(e.target.value).toISOString();
      onSetAnchor(time);
    }
  };

  const defaultTime = anchorTime 
    ? dayjs(anchorTime).format('YYYY-MM-DDTHH:mm')
    : dayjs().format('YYYY-MM-DDTHH:mm');

  return (
    <div className="anchor-input">
      <div className="anchor-header">
        <h3>起始锚点</h3>
        {anchorTime && (
          <span className="anchor-time-display">
            当前: {formatTime(anchorTime)}
          </span>
        )}
      </div>
      
      <div className="anchor-actions">
        <button className="btn btn-primary" onClick={handleQuickSet}>
          {anchorTime ? '更新为现在' : '我醒了'}
        </button>
        
        <div className="custom-time-input">
          <label>或设置自定义时间：</label>
          <input
            type="datetime-local"
            value={defaultTime}
            onChange={handleCustomSet}
          />
        </div>
      </div>
    </div>
  );
}
