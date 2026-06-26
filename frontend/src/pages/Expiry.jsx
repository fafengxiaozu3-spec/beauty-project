import { useState } from "react";
import Sidebar from "../components/Sidebar";

function Expiry() {
  const [menuOpen, setMenuOpen] = useState(false);

  function toggleMenu() {
    setMenuOpen(prev => !prev);
  }

  return (
    <div className="layout">

      <Sidebar
        active="expiry"
        menuOpen={menuOpen}
        toggleMenu={toggleMenu}
      />

      <div className="main">
        <h1>即將過期的商品⚠️</h1>
        <p>內容</p>
      </div>

    </div>
  );
}

export default Expiry;