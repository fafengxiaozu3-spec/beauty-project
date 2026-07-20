import { useState, useEffect } from "react";
import Sidebar from "../components/Sidebar";
import Header from "../components/Header";
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
        <Header
          title="購物清單🛒"
          toggleMenu={toggleMenu}
        />
        <p>內容</p>
      </div>
    </div>
  );
}

export default Shopping;