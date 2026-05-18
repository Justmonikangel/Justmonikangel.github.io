import { Route, Routes } from "react-router-dom";
import { PitchStrip } from "./components/PitchStrip";
import { TopBar } from "./components/TopBar";
import Home from "./routes/Home";
import Capture from "./routes/Capture";
import Squad from "./routes/Squad";
import Allocate from "./routes/Allocate";
import Settle from "./routes/Settle";

export default function App() {
  return (
    <div className="app-shell">
      <TopBar />
      <PitchStrip />
      <main className="app-body">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/capture" element={<Capture />} />
          <Route path="/squad" element={<Squad />} />
          <Route path="/allocate" element={<Allocate />} />
          <Route path="/settle" element={<Settle />} />
          <Route path="*" element={<Home />} />
        </Routes>
      </main>
    </div>
  );
}
