import { Link } from 'react-router-dom';

export default function ForumPreview({ threads = [] }) {
  return (
    <aside className="sidebar">
      <div className="panel">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
          <h3 style={{ margin: 0 }}>Community</h3>
          <Link to="/forum" style={{ fontSize: '0.85rem', color: 'var(--primary)' }}>
            View all
          </Link>
        </div>
        <div className="list">
          {threads.map(t => (
            <Link key={t.id} to={`/forum/${t.id}`} className="thread">
              <div>
                <div className="user">@{t.username || 'User'}</div>
                <div className="title strong">{t.title}</div>
                <p className="excerpt">
                  {t.body?.substring(0, 80) || 'No content'}
                  {t.body?.length > 80 ? '...' : ''}
                </p>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </aside>
  );
}
