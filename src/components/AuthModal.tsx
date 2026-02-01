import { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';

interface AuthModalProps {
  onClose: () => void;
}

export function AuthModal({ onClose }: AuthModalProps) {
  const { signInWithEmail, user, signOut, isOnlineMode } = useAuth();
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;

    setLoading(true);
    setMessage('');

    const { error } = await signInWithEmail(email);

    if (error) {
      setMessage(`发送失败: ${error.message}`);
    } else {
      setMessage('登录链接已发送到邮箱，请查收并点击链接登录');
    }
    setLoading(false);
  };

  const handleSignOut = async () => {
    await signOut();
    onClose();
  };

  if (!isOnlineMode) {
    return (
      <div className="task-editor-overlay" onClick={onClose}>
        <div className="task-editor" onClick={(e) => e.stopPropagation()}>
          <h2>离线模式</h2>
          <p style={{ color: '#718096', marginBottom: '20px' }}>
            未配置 Supabase，当前为离线模式。数据仅保存在本地。
          </p>
          <p style={{ color: '#718096', fontSize: '14px' }}>
            如需开启同步，请在 .env 文件中配置 VITE_SUPABASE_URL 和 VITE_SUPABASE_ANON_KEY
          </p>
          <div className="form-actions">
            <button type="button" onClick={onClose}>关闭</button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="task-editor-overlay" onClick={onClose}>
      <div className="task-editor" onClick={(e) => e.stopPropagation()}>
        {user ? (
          <>
            <h2>已登录</h2>
            <p style={{ color: '#1a202c', marginBottom: '8px' }}>
              {user.email}
            </p>
            <p style={{ color: '#10b981', fontSize: '14px', marginBottom: '20px' }}>
              数据已开启云端同步
            </p>
            <div className="form-actions">
              <button type="button" onClick={handleSignOut}>退出登录</button>
              <button type="button" onClick={onClose}>关闭</button>
            </div>
          </>
        ) : (
          <>
            <h2>登录以同步数据</h2>
            <p style={{ color: '#718096', marginBottom: '20px', fontSize: '14px' }}>
              登录后，任务数据将在多设备间自动同步
            </p>
            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label>邮箱地址</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="your@email.com"
                  required
                />
              </div>
              {message && (
                <p style={{
                  color: message.includes('失败') ? '#ef4444' : '#10b981',
                  fontSize: '14px',
                  marginBottom: '16px'
                }}>
                  {message}
                </p>
              )}
              <div className="form-actions">
                <button type="button" onClick={onClose}>取消</button>
                <button type="submit" disabled={loading}>
                  {loading ? '发送中...' : '发送登录链接'}
                </button>
              </div>
            </form>
          </>
        )}
      </div>
    </div>
  );
}
