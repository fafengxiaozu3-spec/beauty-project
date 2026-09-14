import { useState, useEffect } from "react";
import Sidebar from "../components/Sidebar";
import Header from "../components/Header";
import { initLiff } from "../services/liff";

function Expiry() {
  const [menuOpen, setMenuOpen] = useState(false);

  const [cosmetics, setCosmetics] = useState([]);
  const [skincare, setSkincare] = useState([]);

  const [loading, setLoading] = useState(true);
  const [deletingId, setDeletingId] = useState(null);

  function toggleMenu() {
    setMenuOpen((prev) => !prev);
  }

  // =========================
  // 取得即將過期產品
  // =========================
  useEffect(() => {
    async function loadExpiryProducts() {
      try {
        const profile = await initLiff();

        if (!profile) {
          setLoading(false);
          return;
        }

        const userId = profile.userId;

        const [cosmeticsRes, skincareRes] = await Promise.all([
          fetch(
            `https://mybeautystudio-backend.onrender.com/api/products?user_id=${userId}&product_type=cosmetics`
          ),
          fetch(
            `https://mybeautystudio-backend.onrender.com/api/products?user_id=${userId}&product_type=skincare`
          )
        ]);

        const cosmeticsData = await cosmeticsRes.json();
        const skincareData = await skincareRes.json();

        const today = new Date();
        today.setHours(0, 0, 0, 0);

        const sixMonthsLater = new Date(today);
        sixMonthsLater.setMonth(
          sixMonthsLater.getMonth() + 6
        );

        function filterExpiryProducts(data) {
          return data
            .map((product) => {
              if (!product.expire_date) {
                return null;
              }

              const expireDate = new Date(
                product.expire_date
              );

              expireDate.setHours(0, 0, 0, 0);

              const diffTime =
                expireDate.getTime() - today.getTime();

              const daysLeft = Math.ceil(
                diffTime / (1000 * 60 * 60 * 24)
              );

              return {
                ...product,
                daysLeft,
                expireDate
              };
            })
            .filter((product) => {
              if (!product) {
                return false;
              }

              return (
                product.daysLeft < 0 ||
                product.expireDate <= sixMonthsLater
              );
            })
            .sort(
              (a, b) =>
                a.daysLeft - b.daysLeft
            );
        }

        setCosmetics(
          filterExpiryProducts(cosmeticsData)
        );

        setSkincare(
          filterExpiryProducts(skincareData)
        );
      } catch (error) {
        console.log(
          "取得即將過期產品失敗：",
          error
        );
      } finally {
        setLoading(false);
      }
    }

    loadExpiryProducts();
  }, []);

  // =========================
  // 刪除產品
  // =========================
  async function deleteProduct(product) {
    const confirmDelete = window.confirm(
      `確定要刪除「${product.product_name}」嗎？`
    );

    if (!confirmDelete) {
      return;
    }

    try {
      setDeletingId(product.id);

      const res = await fetch(
        `https://mybeautystudio-backend.onrender.com/api/products/${product.id}`,
        {
          method: "DELETE"
        }
      );

      if (!res.ok) {
        throw new Error("刪除失敗");
      }

      // 從目前畫面移除
      setCosmetics((prev) =>
        prev.filter(
          (item) => item.id !== product.id
        )
      );

      setSkincare((prev) =>
        prev.filter(
          (item) => item.id !== product.id
        )
      );
    } catch (error) {
      console.log("刪除產品失敗：", error);
      alert("刪除失敗，請稍後再試");
    } finally {
      setDeletingId(null);
    }
  }

  // =========================
  // 產品卡片
  // =========================
  function renderProductCard(product) {
    return (
      <div
        className="expiry-card"
        key={product.id}
      >
        <div className="expiry-photo">
          {product.image_url ? (
            <img
              src={product.image_url}
              alt={product.product_name}
            />
          ) : (
            <div className="expiry-photo-empty">
              🧴
            </div>
          )}
        </div>

        <div className="expiry-card-info">
          <div className="expiry-brand">
            {product.brand}
          </div>

          <div className="expiry-product-name">
            {product.product_name}
            {product.shade && (
              <span className="expiry-shade">
                · {product.shade}
              </span>
            )}
          </div>

          <div className="expiry-category">
            {product.category}
          </div>
        </div>

        <div className="expiry-card-right">
          <div
            className={
              product.daysLeft < 0
                ? "expiry-date expired"
                : product.daysLeft <= 30
                ? "expiry-date danger"
                : "expiry-date"
            }
          >
            <span className="expiry-date-label">
              到期提醒
            </span>

            <span className="expiry-date-value">
              {product.daysLeft < 0
                ? "已過期"
                : `${product.daysLeft}天`}
            </span>
          </div>

          <button
            className="expiry-delete-btn"
            onClick={() =>
              deleteProduct(product)
            }
            disabled={
              deletingId === product.id
            }
            title="刪除產品"
          >
            {deletingId === product.id
              ? "..."
              : "🗑️"}
          </button>
        </div>
      </div>
    );
  }

  const totalCount =
    cosmetics.length + skincare.length;

  return (
    <div className="layout">
      <Sidebar
        active="expiry"
        menuOpen={menuOpen}
        toggleMenu={toggleMenu}
      />

      <div className="main">
        <Header
          title="即將過期⏰"
          toggleMenu={toggleMenu}
        />

        {loading ? (
          <div className="product-loading">
            <div className="loading-circle"></div>
            <p>正在檢查產品期限...</p>
          </div>
        ) : (
          <>
            {/* =========================
                提醒摘要
            ========================= */}
            <div className="expiry-summary">
              <div className="expiry-summary-icon">
                ⏰
              </div>

              <div>
                <p className="expiry-summary-title">
                  期限提醒
                </p>

                <p className="expiry-summary-text">
                  {totalCount > 0
                    ? `目前有 ${totalCount} 項產品需要注意期限`
                    : "目前沒有需要注意期限的產品"}
                </p>
              </div>
            </div>

            {/* =========================
                化妝品
            ========================= */}
            <section className="expiry-section">
              <div className="expiry-section-title">
                <span>💄</span>
                <h2>化妝品</h2>
                <span className="expiry-count">
                  {cosmetics.length}
                </span>
              </div>

              {cosmetics.length === 0 ? (
                <div className="expiry-section-empty">
                  🎉 目前沒有即將過期的化妝品
                </div>
              ) : (
                <div className="expiry-list">
                  {cosmetics.map(
                    renderProductCard
                  )}
                </div>
              )}
            </section>

            {/* =========================
                保養品
            ========================= */}
            <section className="expiry-section">
              <div className="expiry-section-title">
                <span>🧴</span>
                <h2>保養品</h2>
                <span className="expiry-count">
                  {skincare.length}
                </span>
              </div>

              {skincare.length === 0 ? (
                <div className="expiry-section-empty">
                  🎉 目前沒有即將過期的保養品
                </div>
              ) : (
                <div className="expiry-list">
                  {skincare.map(
                    renderProductCard
                  )}
                </div>
              )}
            </section>
          </>
        )}
      </div>
    </div>
  );
}

export default Expiry;