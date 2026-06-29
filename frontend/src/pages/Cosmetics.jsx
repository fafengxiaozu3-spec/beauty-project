import { useState, useEffect } from "react";
import Sidebar from "../components/Sidebar";
import { initLiff } from "../services/liff";

function Cosmetics() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [products, setProducts] = useState([]);
  const [showForm, setShowForm] = useState(false);

  const [form, setForm] = useState({
    product_name: "",
    brand: "",
    category: "",
    open_date: "",
    expire_months: ""
  });

  function toggleMenu() {
    setMenuOpen(prev => !prev);
  }

  useEffect(() => {
    async function start() {
      const profile = await initLiff();
      if (!profile) return;

      loadProducts(profile.userId);
    }

    start();
  }, []);

  async function loadProducts(userId) {
    try {
      const res = await fetch(
        `https://mybeautystudio-backend.onrender.com/api/products?user_id=${userId}`
      );

      const data = await res.json();
      setProducts(data);

    } catch (err) {
      console.log(err);
    }
  }

  function handleChange(e) {
    setForm({
      ...form,
      [e.target.name]: e.target.value
    });
  }

  async function createProduct() {
    try {
      const userId = localStorage.getItem("lineUserId");

      const expire = new Date(form.open_date);
      expire.setMonth(
        expire.getMonth() +
        Number(form.expire_months)
      );

      await fetch(
        "https://mybeautystudio-backend.onrender.com/api/products",
        {
          method: "POST",

          headers: {
            "Content-Type": "application/json"
          },

          body: JSON.stringify({
            ...form,
            user_id: userId,
            expire_date:
              expire
                .toISOString()
                .split("T")[0]
          })
        }
      );

      setShowForm(false);

      setForm({
        product_name: "",
        brand: "",
        category: "",
        open_date: "",
        expire_months: ""
      });

      loadProducts(userId);

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

        <div className="info-grid">
          {products.map(item => (
            <div
              key={item._id}
              className="info-box"
            >
              <h3>{item.product_name}</h3>
              <p>{item.brand}</p>
            </div>
          ))}
        </div>

        <button
          className="add-btn"
          onClick={() =>
            setShowForm(true)
          }
        >
          ＋
        </button>

        {showForm && (
          <div className="popup">

            <input
              name="product_name"
              placeholder="名稱"
              onChange={handleChange}
            />

            <input
              name="brand"
              placeholder="品牌"
              onChange={handleChange}
            />

            <input
              name="category"
              placeholder="分類"
              onChange={handleChange}
            />

            <input
              type="date"
              name="open_date"
              onChange={handleChange}
            />

            <input
              type="number"
              name="expire_months"
              placeholder="保存(月)"
              onChange={handleChange}
            />

            <button
              onClick={createProduct}
            >
              新增
            </button>

          </div>
        )}

      </div>

    </div>
  );
}

export default Cosmetics;