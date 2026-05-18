import { Link } from "react-router-dom";

const MERCHANT_URL =
  "https://gorgeous-empanada-b20b09.netlify.app/smart-split-memory-lab.html";

export function TopBar({ crumb }: { crumb?: string }) {
  return (
    <header className="topbar">
      <Link to="/" className="brand">
        <span className="brand-mark">S</span>
        <span>SmartSplit</span>
      </Link>
      <div className="topbar-right">
        {crumb && <span className="crumb">{crumb}</span>}
        <a
          href={MERCHANT_URL}
          className="back-merchant"
          title="Back to the Smart Split merchant side"
        >
          ← Smart Split
        </a>
        <a href="/pcos/" className="back-cyster" title="Back to Cyster">
          ← Cyster
        </a>
      </div>
    </header>
  );
}
