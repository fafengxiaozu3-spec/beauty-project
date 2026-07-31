import { useState, useEffect } from "react";
import Sidebar from "../components/Sidebar";
import Header from "../components/Header";
import { initLiff } from "../services/liff";

function Home() {
  const [menuOpen, setMenuOpen] = useState(false);

  const [cosmeticsCount, setCosmeticsCount] = useState(0);
  const [expiryCount, setExpiryCount] = useState(0);

  const [loadingCosmetics, setLoadingCosmetics] = useState(true);
  const [loadingExpiry, setLoadingExpiry] = useState(true);

  function toggleMenu() {
    setMenuOpen((prev) => !prev);
  }

  useEffect(() => {
    async function loadDashboard() {
      const profile = await initLiff();

      if (!profile) return;

      const userId = profile.userId;

      try {
        // 取得化妝品
        const productsRes = await fetch(
          `https://mybeautystudio-backend.onrender.com/api/products?user_id=${userId}`
        );

        const products = await productsRes.json();

        setCosmeticsCount(products.length);
        setLoadingCosmetics(false);

        // 計算即將過期
        const today = new Date();

        const sixMonthsLater = new Date();
        sixMonthsLater.setMonth(
          sixMonthsLater.getMonth() + 6
        );

        const expiryProducts = products.filter((product) => {
          if (!product.expire_date) {
            return false;
          }

          const expireDate = new Date(
            product.expire_date
          );

          return (
            expireDate >= today &&
            expireDate <= sixMonthsLater
          );
        });

        setExpiryCount(expiryProducts.length);
        setLoadingExpiry(false);

      } catch (error) {
        console.log(error);

        setLoadingCosmetics(false);
        setLoadingExpiry(false);
      }
    }

    loadDashboard();
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

          {/* 化妝品數量 */}
          <div className="info-box">

            <p>化妝品數量</p>

            {loadingCosmetics ? (
              <div className="count-loading"></div>
            ) : (
              <h3>{cosmeticsCount}</h3>
            )}

          </div>


          {/* 保養品數量 */}
          <div className="info-box">

            <p>保養品數量</p>

            <h3>8</h3>

          </div>


          {/* 即將過期 */}
          <div className="info-box">

            <p>即將過期</p>

            {loadingExpiry ? (
              <div className="count-loading"></div>
            ) : (
              <h3>{expiryCount}</h3>
            )}

          </div>

        </div>

      </div>

    </div>
  );
}

export default Home;