import { Link } from "react-router-dom";

export function TopBar({ crumb }: { crumb?: string }) {
  return (
    <header className="topbar">
      <Link to="/" className="brand">
        <span className="brand-mark">S</span>
        <span>SmartSplit</span>
      </Link>
      <div className="topbar-right">
        {crumb && <span className="crumb">{crumb}</span>}
        <a href="/pcos/" className="back-cyster" title="Back to Cyster">
          ← Cyster
        </a>
      </div>
    </header>
  );
}
