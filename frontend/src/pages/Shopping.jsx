import { useState } from "react";
import Sidebar from "../components/Sidebar";

function Shopping() {
  const [menuOpen, setMenuOpen] = useState(false);

  function toggleMenu() {
    setMenuOpen(prev => !prev);
  }

  return (
    <div className="layout">

      <Sidebar
        active="shopping"
        menuOpen={menuOpen}
        toggleMenu={toggleMenu}
      />

      <div className="main">
        <h1>我的購物車🛒</h1>
        <p>內容</p>
      </div>

    </div>
  );
}

export default Shopping;