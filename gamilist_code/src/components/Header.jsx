export default function Header() {
  return (
    <header className="hdr">
      <div className="container hdr-row">
        <div className="brand">Gamilist</div>
        <nav className="nav">
          <a href="#">Games</a>
          <a href="#">Community</a>
          <a href="#">Lists</a>
        </nav>
        <div className="hdr-actions">
          <button className="btn ghost">Search</button>
          <button className="btn">Profile</button>
        </div>
      </div>
    </header>
  );
}
