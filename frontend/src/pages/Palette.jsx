import { useState, useEffect } from "react";
import Sidebar from "../components/Sidebar";
import Header from "../components/Header";
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

        <Header
          title="我的色卡🎨"
          toggleMenu={toggleMenu}
        />

        <p>內容</p>

      </div>
    </div>
  );
}

export default Palette;