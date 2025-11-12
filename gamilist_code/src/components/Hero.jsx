export default function Hero({ title, tagline, background, onPrimary }) {
  return (
    <section className="hero" aria-label="Featured game">
      {background && <img className="hero-bg" src={background} alt="" aria-hidden="true" />}
      <div className="hero-grad" />
      <div className="container hero-content">
        <p className="eyebrow">Popular</p>
        <h1>{title}</h1>
        {tagline && <p className="muted">{tagline}</p>}
        <div className="actions">
          <button className="btn primary" onClick={onPrimary}>Track Game</button>
          <button className="btn ghost">Details</button>
        </div>
      </div>
    </section>
  );
}
