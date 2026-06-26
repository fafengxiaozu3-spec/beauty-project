import { useState } from "react";
import Sidebar from "../components/Sidebar";

function Cosmetics() {
  const [menuOpen, setMenuOpen] = useState(false);

  function toggleMenu() {
    setMenuOpen(prev => !prev);
  }

  return (
    <div className="layout">

      <Sidebar
        active="cosmetics"
        menuOpen={menuOpen}
        toggleMenu={toggleMenu}
      />

      <div className="main">
        <h1>我的化妝品💄</h1>
        <p>內容</p>
      </div>

    </div>
  );
}

export default Cosmetics;