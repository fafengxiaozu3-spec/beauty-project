
import { useState, useEffect } from "react";
import Sidebar from "../components/Sidebar";
import Header from "../components/Header";
import { initLiff } from "../services/liff";

function Home() {
  const [menuOpen, setMenuOpen] = useState(false);

  const [cosmetics, setCosmetics] = useState([]);
  const [skincare, setSkincare] = useState([]);

  const [loading, setLoading] = useState(true);
  const [showDetail, setShowDetail] = useState(false);
  const [detailType, setDetailType] = useState("");

  const [productCount, setProductCount] = useState(0);
  const [skincareCount, setSkincareCount] = useState(0);
  const [expiringCount, setExpiringCount] = useState(0);
  const [expiredCount, setExpiredCount] = useState(0);

  function toggleMenu() {
    setMenuOpen((prev) => !prev);
  }

  // 判斷商品效期
  function getDaysLeft(product) {
    if (!product.expire_date) return null;

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const expireDate = new Date(product.expire_date);
    expireDate.setHours(0, 0, 0, 0);

    return Math.ceil(
      (expireDate.getTime() - today.getTime()) /
        (1000 * 60 * 60 * 24)
    );
  }

  // 取得效期商品
  const allProducts = [...cosmetics, ...skincare];

  const expiringProducts = allProducts.filter((product) => {
    const days = getDaysLeft(product);
    return days !== null && days >= 0 && days <= 180;
  });

  const expiredProducts = allProducts.filter((product) => {
    const days = getDaysLeft(product);
    return days !== null && days < 0;
  });

  useEffect(() => {
    async function loadDashboard() {
      try {
        const profile = await initLiff();

        if (!profile) return;

        const userId = profile.userId;
        const baseUrl =
          "https://mybeautystudio-backend.onrender.com/api/products";

        const [cosmeticsRes, skincareRes] = await Promise.all([
          fetch(
            `${baseUrl}?user_id=${encodeURIComponent(userId)}&product_type=cosmetics`
          ),
          fetch(
            `${baseUrl}?user_id=${encodeURIComponent(userId)}&product_type=skincare`
          ),
        ]);

        if (!cosmeticsRes.ok || !skincareRes.ok) {
          throw new Error("取得商品資料失敗");
        }

        const cosmeticsData = await cosmeticsRes.json();
        const skincareData = await skincareRes.json();

        setCosmetics(cosmeticsData);
        setSkincare(skincareData);

        setProductCount(cosmeticsData.length);
        setSkincareCount(skincareData.length);

        // 統計化妝品與保養品的效期
        const products = [...cosmeticsData, ...skincareData];

        let expiring = 0;
        let expired = 0;

        products.forEach((product) => {
          const days = getDaysLeft(product);

          if (days === null) return;

          if (days < 0) {
            expired++;
          } else if (days <= 180) {
            expiring++;
          }
        });

        setExpiringCount(expiring);
        setExpiredCount(expired);
      } catch (error) {
        console.error("取得 Dashboard 資料失敗:", error);
      } finally {
        setLoading(false);
      }
    }

    loadDashboard();
  }, []);

  // 點擊統計卡片
  function handleCardClick(type) {
    if (type === "cosmetics") {
      window.location.href = "/cosmetics";
      return;
    }

    if (type === "skincare") {
      window.location.href = "/skincare";
      return;
    }

    setDetailType(type);
    setShowDetail(true);
  }

  // 關閉詳細視窗時鎖定／恢復背景捲動
  useEffect(() => {
    if (showDetail) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }

    return () => {
      document.body.style.overflow = "";
    };
  }, [showDetail]);

  const detailProducts =
    detailType === "expiring"
      ? expiringProducts
      : expiredProducts;

  const detailTitle =
    detailType === "expiring"
      ? "即將過期商品 ⏰"
      : "已過期商品 ⚠️";

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

        <div className="home-heading">
          <h2>我的美妝管理中心</h2>
          <p>隨時掌握你的美妝用品與商品效期 ✨</p>
        </div>

        <div className="dashboard-grid">
          <button
            type="button"
            className="dashboard-card"
            onClick={() => handleCardClick("cosmetics")}
          >
            <div className="dashboard-card-top">
              <div className="dashboard-icon pink">💄</div>
              <span className="dashboard-arrow">›</span>
            </div>
            <p>化妝品數量</p>
            {loading ? (
              <div className="count-loading" />
            ) : (
              <h3>{productCount}<span> 件</span></h3>
            )}
            <small>查看我的化妝品</small>
          </button>

          <button
            type="button"
            className="dashboard-card"
            onClick={() => handleCardClick("skincare")}
          >
            <div className="dashboard-card-top">
              <div className="dashboard-icon lavender">🧴</div>
              <span className="dashboard-arrow">›</span>
            </div>
            <p>保養品數量</p>
            {loading ? (
              <div className="count-loading" />
            ) : (
              <h3>{skincareCount}<span> 件</span></h3>
            )}
            <small>查看我的保養品</small>
          </button>

          <button
            type="button"
            className="dashboard-card"
            onClick={() => handleCardClick("expiring")}
          >
            <div className="dashboard-card-top">
              <div className="dashboard-icon peach">⏰</div>
              <span className="dashboard-arrow">›</span>
            </div>
            <p>即將過期</p>
            {loading ? (
              <div className="count-loading" />
            ) : (
              <h3>{expiringCount}<span> 件</span></h3>
            )}
            <small>180 天內到期的商品</small>
          </button>

          <button
            type="button"
            className="dashboard-card"
            onClick={() => handleCardClick("expired")}
          >
            <div className="dashboard-card-top">
              <div className="dashboard-icon red">⚠️</div>
              <span className="dashboard-arrow">›</span>
            </div>
            <p>已過期</p>
            {loading ? (
              <div className="count-loading" />
            ) : (
              <h3>{expiredCount}<span> 件</span></h3>
            )}
            <small>查看已過期的商品</small>
          </button>
        </div>

        {!loading && (
          <div className="home-tip">
            <span>🌷</span>
            <div>
              <strong>好好整理，讓每件美妝用品都發揮價值</strong>
              <p>定期查看商品效期，讓日常保養與化妝更有條理。</p>
            </div>
          </div>
        )}
      </div>

      {/* 效期商品詳細視窗 */}
      {showDetail && (
        <div
          className="home-detail-overlay"
          onClick={() => setShowDetail(false)}
        >
          <div
            className="home-detail-modal"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              type="button"
              className="home-detail-close"
              onClick={() => setShowDetail(false)}
              aria-label="關閉"
            >
              ×
            </button>

            <div className="home-detail-heading">
              <h2>{detailTitle}</h2>
              <p>共 {detailProducts.length} 件商品</p>
            </div>

            <div className="home-detail-list">
              {detailProducts.length === 0 ? (
                <div className="home-detail-empty">
                  {detailType === "expiring"
                    ? "目前沒有 180 天內到期的商品 🌷"
                    : "目前沒有已過期的商品 ✨"}
                </div>
              ) : (
                detailProducts.map((product, index) => {
                  const days = getDaysLeft(product);

                  return (
                    <div
                      className="home-detail-item"
                      key={`${product.id ?? product._id ?? product.product_name}-${index}`}
                    >
                      <div className="home-detail-item-icon">
                        {product.product_type === "cosmetics"
                          ? "💄"
                          : product.product_type === "skincare"
                          ? "🧴"
                          : "🌸"}
                      </div>

                      <div className="home-detail-item-info">
                        <strong>{product.product_name}</strong>
                        <span>
                          {product.brand}
                          {product.category
                            ? ` · ${product.category}`
                            : ""}
                        </span>
                        <small>
                          到期日：
                          {product.expire_date
                            ? String(product.expire_date).slice(0, 10)
                            : "未填寫"}
                        </small>
                      </div>

                      <div
                        className={`home-detail-days ${
                          days < 0 ? "expired" : ""
                        }`}
                      >
                        {days < 0
                          ? "已過期"
                          : days === 0
                          ? "今天到期"
                          : `${days} 天`}
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            <button
              type="button"
              className="home-detail-done"
              onClick={() => setShowDetail(false)}
            >
              關閉
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default Home;
