import { useState, useEffect } from "react";
import Sidebar from "../components/Sidebar";
import { initLiff } from "../services/liff";

function Cosmetics() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [products, setProducts] = useState([]);

  function toggleMenu() {
    setMenuOpen((prev) => !prev);
  }

  useEffect(() => {
    async function start() {
      const profile = await initLiff();

      if (!profile) return;

      loadProducts();
    }

    start();
  }, []);

  async function loadProducts() {
    try {
      const userId =
        localStorage.getItem("lineUserId");

      const res = await fetch(
        `https://mybeautystudio-backend.onrender.com/api/products?user_id=${userId}`
      );

      const data = await res.json();

      setProducts(data);

    } catch (err) {
      console.log(err);
    }
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

        {products.length === 0 ? (
          <p>尚未新增商品</p>
        ) : (
          <div className="info-grid">
            {products.map((item) => (
              <div
                key={item._id}
                className="info-box"
              >
                <h3>{item.product_name}</h3>
                <p>{item.brand}</p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default Cosmetics;