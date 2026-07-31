import { useState, useEffect } from "react";
import Sidebar from "../components/Sidebar";
import Header from "../components/Header";
import { initLiff } from "../services/liff";

function Home() {
  const [menuOpen, setMenuOpen] = useState(false);

  const [productCount, setProductCount] = useState(0);
  const [expiryCount, setExpiryCount] = useState(0);

  function toggleMenu() {
    setMenuOpen((prev) => !prev);
  }

  useEffect(() => {
    async function loadDashboard() {
      const profile = await initLiff();

      if (!profile) return;

      const userId = profile.userId;

      try {
        const res = await fetch(
          `https://mybeautystudio-backend.onrender.com/api/products?user_id=${userId}`
        );

        const products = await res.json();

        // =========================
        // 化妝品總數
        // =========================

        setProductCount(products.length);


        // =========================
        // 計算 6 個月後的日期
        // =========================

        const today = new Date();

        const sixMonthsLater = new Date(today);
        sixMonthsLater.setMonth(
          sixMonthsLater.getMonth() + 6
        );


        // =========================
        // 計算即將過期數量
        // 包含：
        // 1. 已經過期
        // 2. 6 個月內到期
        // =========================

        const expiryProducts = products.filter(
          (product) => {

            if (!product.expire_date) {
              return false;
            }

            const expireDate =
              new Date(product.expire_date);

            return (
              expireDate < today ||
              expireDate <= sixMonthsLater
            );
          }
        );


        setExpiryCount(
          expiryProducts.length
        );

      } catch (err) {
        console.log(
          "取得 Dashboard 資料失敗:",
          err
        );
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

            <p>
              化妝品數量
            </p>

            <h3>
              {productCount}
            </h3>

          </div>


          {/* 保養品數量 */}

          <div className="info-box">

            <p>
              保養品數量
            </p>

            <h3>
              8
            </h3>

          </div>


          {/* 即將過期 */}

          <div className="info-box">

            <p>
              即將過期
            </p>

            <h3>
              {expiryCount}
            </h3>

          </div>

        </div>

      </div>

    </div>
  );
}

export default Home;