import { Link } from "react-router-dom";

export default function ForumPreview({ threads = [] }) {
  return (
    <aside className="sidebar">
      <div className="panel">
        <h3>Community</h3>
        <div className="list">
          {threads.map((t) => {
            const author = t.author_username || t.user || "Unknown";
            const previewSource = t.excerpt || t.body || "";
            const preview =
              previewSource.length > 90
                ? previewSource.slice(0, 90) + "…"
                : previewSource;

            return (
              <Link
                key={t.id}
                className="thread"
                to={`/forum/${t.id}`}
              >
                <div className="user">@{author}</div>
                <div className="title strong">{t.title}</div>
                {preview && <p className="excerpt">{preview}</p>}
              </Link>
            );
          })}
        </div>
      </div>
    </aside>
  );
}
