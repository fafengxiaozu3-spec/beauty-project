import { useState, useEffect } from "react";
import Sidebar from "../components/Sidebar";
import Header from "../components/Header";
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

         <Header
          title="我的保養品"
          toggleMenu={toggleMenu}
        />
        <p>內容</p>
      </div>
    </div>
  );
}

export default Skincare;