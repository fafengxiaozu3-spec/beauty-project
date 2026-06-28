import { useState, useEffect } from "react";
import Sidebar from "../components/Sidebar";
import { initLiff } from "../services/liff";

function Palette() {
  const [menuOpen, setMenuOpen] = useState(false);

  function toggleMenu() {
    setMenuOpen((prev) => !prev);
  }

  useEffect(() => {
    initLiff();
  }, []);

  return (
    <div className="layout">
      <Sidebar
        active="palette"
        menuOpen={menuOpen}
        toggleMenu={toggleMenu}
      />

      <div className="main">
        <h1>我的色卡🎨</h1>
        <p>內容</p>
      </div>
    </div>
  );
}

export default Palette;