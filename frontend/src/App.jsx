import { BrowserRouter, Routes, Route } from "react-router-dom";
import { useEffect, useState } from "react";

import { initLiff } from "./services/liff";

import Home from "./pages/Home";
import Cosmetics from "./pages/Cosmetics";
import Skincare from "./pages/Skincare";
import Palette from "./pages/Palette";
import Shopping from "./pages/Shopping";
import Expiry from "./pages/Expiry";

function App() {
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function login() {
      await initLiff();
      setLoading(false);
    }

    login();
  }, []);

  if (loading) {
    return(
      <div className="loading-screen">

      <div className="loading-logo">
        你的美妝管理 💄
      </div>

      <div className="loading-circle"></div>

      <div className="loading-text">
        正在登入 LINE...
        <br />
        請稍候
      </div>

    </div>
    )
  }

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Home />} />

        <Route path="/cosmetics" element={<Cosmetics />} />

        <Route path="/skincare" element={<Skincare />} />

        <Route path="/palette" element={<Palette />} />

        <Route path="/shopping" element={<Shopping />} />

        <Route path="/expiry" element={<Expiry />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;