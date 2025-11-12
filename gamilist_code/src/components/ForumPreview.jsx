export default function ForumPreview({ threads = [] }) {
  return (
    <aside className="sidebar">
      <div className="panel">
        <h3>Community</h3>
        <div className="list">
          {threads.map(t => (
            <a key={t.id} className="thread" href={t.link}>
              <div>
                <div className="user">@{t.user}</div>
                <div className="title strong">{t.title}</div>
                <p className="excerpt">{t.excerpt}</p>
              </div>
            </a>
          ))}
        </div>
      </div>
    </aside>
  );
}
