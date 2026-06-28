import { useState, useEffect } from "react";
import Sidebar from "../components/Sidebar";
import { initLiff } from "../services/liff";

function Shopping() {
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
        active="shopping"
        menuOpen={menuOpen}
        toggleMenu={toggleMenu}
      />

      <div className="main">
        <h1>購物清單🛒</h1>
        <p>內容</p>
      </div>
    </div>
  );
}

export default Shopping;