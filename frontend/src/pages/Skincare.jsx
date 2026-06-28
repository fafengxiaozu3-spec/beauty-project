import { useState, useEffect } from "react";
import Sidebar from "../components/Sidebar";
import { initLiff } from "../services/liff";

function Skincare() {
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
        active="skincare"
        menuOpen={menuOpen}
        toggleMenu={toggleMenu}
      />

      <div className="main">
        <h1>我的保養品🧴</h1>
        <p>內容</p>
      </div>
    </div>
  );
}

export default Skincare;