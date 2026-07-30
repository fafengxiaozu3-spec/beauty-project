import { useState, useEffect } from "react";
import Sidebar from "../components/Sidebar";
import Header from "../components/Header";
import { initLiff } from "../services/liff";

function Expiry() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  function toggleMenu() {
    setMenuOpen((prev) => !prev);
  }

  useEffect(() => {
    async function loadExpiryProducts() {
      try {
        const profile = await initLiff();

        if (!profile) {
          setLoading(false);
          return;
        }

        const res = await fetch(
          `https://mybeautystudio-backend.onrender.com/api/products?user_id=${profile.userId}`
        );

        const data = await res.json();

        // 今天
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        // 今天往後 6 個月
        const sixMonthsLater = new Date(today);
        sixMonthsLater.setMonth(
          sixMonthsLater.getMonth() + 6
        );

        // 篩選即將過期的產品
        const expiryProducts = data
          .map((product) => {
            // 沒有有效期限就不處理
            if (!product.expire_date) {
              return null;
            }

            const expireDate = new Date(
              product.expire_date
            );

            expireDate.setHours(0, 0, 0, 0);

            // 計算剩餘天數
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
            if (!product) return false;

            // 已經過期的不顯示
            if (product.daysLeft < 0) {
              return false;
            }

            // 只顯示 6 個月內到期
            return product.expireDate <= sixMonthsLater;
          })
          // 剩餘天數少的排前面
          .sort(
            (a, b) =>
              a.daysLeft - b.daysLeft
          );

        setProducts(expiryProducts);

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

            <p>
              正在檢查即將過期的化妝品...
            </p>
          </div>

        ) : products.length === 0 ? (

          <div className="expiry-empty">
            <p>
              🎉 目前沒有即將過期的化妝品
            </p>
          </div>

        ) : (

          <div className="expiry-list">

            {products.map((product) => (

              <div
                className="expiry-item"
                key={product.id}
              >

                <div className="expiry-product">

                  <div className="expiry-name">
                    {product.brand}{" "}
                    {product.product_name}
                    {product.shade &&
                      ` ${product.shade}`}
                  </div>

                </div>

                <div
                  className={
                    product.daysLeft <= 7
                      ? "expiry-days danger"
                      : "expiry-days"
                  }
                >
                  {product.daysLeft}天
                </div>

              </div>

            ))}

          </div>

        )}

      </div>

    </div>
  );
}

export default Expiry;