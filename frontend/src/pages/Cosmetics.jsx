import { useState, useEffect } from "react";
import Sidebar from "../components/Sidebar";
import { initLiff } from "../services/liff";

function Cosmetics() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [products, setProducts] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [showMenu, setShowMenu] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState(null);

  const [form, setForm] = useState({
    product_name: "",
    brand: "",
    category: "",
    shade: "",
    manufacture_date: "",
    expire_months: "",
    expire_date: ""
  });

  const [dateMode, setDateMode] = useState("manufacture");

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

      await fetch(
        "https://mybeautystudio-backend.onrender.com/api/products",
        {
          method: "POST",

          headers: {
            "Content-Type": "application/json"
          },

          body: JSON.stringify({

            user_id: userId,

            product_name: form.product_name,
            brand: form.brand,
            category: form.category,
            shade: form.shade,

            date_mode: dateMode,

            manufacture_date:
              dateMode==="manufacture"
                ? form.manufacture_date
                : null,

            expire_months:
              dateMode==="manufacture"
                ? Number(form.expire_months)
                : null,

            expire_date:
              dateMode==="direct"
                ? form.expire_date
                : null

          })
        }
      );

      setShowForm(false);

      setForm({
        product_name: "",
        brand: "",
        category: "",
        shade: "",
        manufacture_date: "",
        expire_months: "",
        expire_date: ""
      });


      setDateMode("manufacture");

      loadProducts(userId);

    } catch (err) {
      console.log(err);
    }
  }

  async function deleteProduct() {

    const confirmDelete = window.confirm(
      `確定要刪除 ${selectedProduct.brand} ${selectedProduct.product_name} 嗎？`
    );

    if (!confirmDelete) return;

    try {
      await fetch(
        `https://mybeautystudio-backend.onrender.com/api/products/${selectedProduct.id}`,
        {
          method: "DELETE"
        }
      );

      loadProducts(localStorage.getItem("lineUserId"));
      setShowMenu(false);

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
      {showForm && (
        <div
          className="popup-overlay"
          onClick={() => setShowForm(false)}
        />
      )}

      {showMenu && (
        <div
          className="popup-overlay"
          onClick={() => setShowMenu(false)}
        />
      )}

      <div className="main">

        <h1>我的化妝品💄</h1>

        <div className="info-grid">
          {products.map(item => (
            <div
              key={item.id}
              className="info-box"
            >
              <button
                className="more-btn"
                onClick={() => {
                  setSelectedProduct(item);
                  setShowMenu(true);
                }}
              >
                ⋮
              </button>

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

        {showMenu && (
          <div
            className="popup-menu"
            onClick={(e) => e.stopPropagation()}
          >

            <button
              onClick={() => {
                setShowMenu(false);
                // 之後做編輯
              }}
            >
              ✏️ 編輯
            </button>

            <button onClick={deleteProduct}>
              🗑️ 刪除
            </button>

          </div>
        )}

        {showForm && (
          <div
            className="popup"
            onClick={(e) => e.stopPropagation()}
          >

            <input
              name="product_name"
              placeholder="名"
              onChange={handleChange}
            />

            <input
              name="brand"
              placeholder="品牌"
              onChange={handleChange}
            />

            <input
              name="shade"
              placeholder="色號"
              onChange={handleChange}
            />

            <input
              name="category"
              placeholder="分類"
              onChange={handleChange}
            />

            <select
              value={dateMode}
              onChange={(e)=>setDateMode(e.target.value)}
            >
              <option value="manufacture">
                製造日期 + 保存期限
              </option>

              <option value="direct">
                直接輸入有效日期
              </option>
            </select>

            {dateMode==="manufacture" ? (
              <>
                <input
                  type="date"
                  name="manufacture_date"
                  onChange={handleChange}
                />

                <input
                  type="number"
                  name="expire_months"
                  placeholder="保存(月)"
                  onChange={handleChange}
                />
              </>
            ) : (
              <input
                type="date"
                name="expire_date"
                onChange={handleChange}
              />
            )}

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