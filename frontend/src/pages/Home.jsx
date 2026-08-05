import { useState, useEffect } from "react";
import Sidebar from "../components/Sidebar";
import Header from "../components/Header";
import { initLiff } from "../services/liff";

function Home() {
  const [menuOpen, setMenuOpen] = useState(false);

  const [productCount, setProductCount] = useState(0);
  const [expiringCount, setExpiringCount] = useState(0);
  const [expiredCount, setExpiredCount] = useState(0);

  const [loading, setLoading] = useState(true);

  function toggleMenu() {
    setMenuOpen((prev) => !prev);
  }

  useEffect(() => {
    async function loadDashboard() {
      try {
        const profile = await initLiff();

        if (!profile) {
          setLoading(false);
          return;
        }

        const userId = profile.userId;

        // 取得使用者的化妝品
        const res = await fetch(
          `https://mybeautystudio-backend.onrender.com/api/products?user_id=${userId}`
        );

        const products = await res.json();

        // 化妝品總數
        setProductCount(products.length);

        // 今天日期
        const today = new Date();

        // 計算即將過期和已過期
        let expiring = 0;
        let expired = 0;

        products.forEach((product) => {
          if (!product.expire_date) {
            return;
          }

          const expireDate = new Date(product.expire_date);

          // 計算距離到期還有幾天
          const diffTime =
            expireDate.getTime() - today.getTime();

          const diffDays =
            Math.ceil(
              diffTime / (1000 * 60 * 60 * 24)
            );

          // 已經過期
          if (diffDays < 0) {
            expired++;
          }

          // 180 天內到期
          else if (diffDays <= 180) {
            expiring++;
          }
        });

        setExpiringCount(expiring);
        setExpiredCount(expired);

      } catch (error) {
        console.error(
          "取得 Dashboard 資料失敗:",
          error
        );
      } finally {
        setLoading(false);
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
          title="我的美妝助理💅🏻"
          toggleMenu={toggleMenu}
        />

        <p className="subtitle">
          我的美妝管理中心
        </p>

        <div className="info-grid">

          {/* 化妝品數量 */}
          <div className="info-box">
            <p>化妝品數量</p>

            {loading ? (
              <div className="count-loading"></div>
            ) : (
              <h3>{productCount}</h3>
            )}
          </div>


          {/* 保養品數量 */}
          <div className="info-box">
            <p>保養品數量</p>

            <h3>0</h3>
          </div>


          {/* 即將過期 */}
          <div className="info-box">
            <p>即將過期</p>

            {loading ? (
              <div className="count-loading"></div>
            ) : (
              <h3>{expiringCount}</h3>
            )}
          </div>


          {/* 已過期 */}
          <div className="info-box">
            <p>已過期</p>

            {loading ? (
              <div className="count-loading"></div>
            ) : (
              <h3>{expiredCount}</h3>
            )}
          </div>

        </div>

      </div>

    </div>
  );
}

export default Home;