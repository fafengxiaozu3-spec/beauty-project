import { useState, useEffect } from "react";
import Sidebar from "../components/Sidebar";
import Header from "../components/Header";
import { initLiff } from "../services/liff";

function Home() {
  const [menuOpen, setMenuOpen] =
    useState(false);

  function toggleMenu() {
    setMenuOpen((prev) => !prev);
  }

  useEffect(() => {
    initLiff();
  }, []);

  return (
    <div className="layout">
      <Sidebar
        active="home"
        menuOpen={menuOpen}
        toggleMenu={toggleMenu}
      />

      <div className="main">

        <Header
          title="Dashboard"
          toggleMenu={toggleMenu}
        />

        <p className="subtitle">
          你的美妝管理中心
        </p>

        <div className="info-grid">
          <div className="info-box">
            <p>化妝品數量</p>
            <h3>12</h3>
          </div>

          <div className="info-box">
            <p>保養品數量</p>
            <h3>8</h3>
          </div>

          <div className="info-box">
            <p>即將過期</p>
            <h3>3</h3>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Home;