import { useState, useEffect } from "react";
import Sidebar from "../components/Sidebar";
import Header from "../components/Header";
import { initLiff } from "../services/liff";

function Cosmetics() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [products, setProducts] = useState([]);
  const [loadingProducts, setLoadingProducts] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [showMenu, setShowMenu] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [editMode, setEditMode] = useState(false);
  const [menuPosition, setMenuPosition] = useState({
    top:0,
    left:0
  });
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

  function resetForm() {
    setEditMode(false);

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
    setLoadingProducts(true);

    try {
      const res = await fetch(
        `https://mybeautystudio-backend.onrender.com/api/products?user_id=${userId}`
      );

      const data = await res.json();
      setProducts(data);

    } catch (err) {
      console.log(err);
    } finally {
      setLoadingProducts(false);
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

  async function updateProduct() {
    try {
      await fetch(
        `https://mybeautystudio-backend.onrender.com/api/products/${selectedProduct.id}`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json"
          },
          body: JSON.stringify(form)
        }
      );

      loadProducts(localStorage.getItem("lineUserId"));

      setEditMode(false);
      setShowForm(false);

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
          onClick={() => {
            setShowForm(false);
            resetForm();
          }}
        />
      )}

      {showMenu && (
        <div
          className="popup-overlay"
          onClick={() => setShowMenu(false)}
        />
      )}

        <div className="main">
        <Header
          title="我的化妝品💄"
          toggleMenu={toggleMenu}
          />

        {loadingProducts ? (

          <div className="product-loading">

            <div className="loading-circle"></div>

            <p>正在取得你的化妝品資料...</p>

          </div>

        ) : (

          <div className="info-grid">
            {products.map(item => (
              <div
                key={item.id}
                className="info-box"
              >
                <button
                  className="more-btn"
                  onClick={(e) => {

                    const rect = e.currentTarget.getBoundingClientRect();

                    const menuWidth = 100; // 編輯刪除框預估寬度
                    const screenWidth = window.innerWidth;

                    let leftPosition = rect.left - 20;


                    // 如果右邊空間不夠，就往左移
                    if (rect.left + menuWidth > screenWidth) {
                      leftPosition = rect.right - menuWidth;
                    }


                    setMenuPosition({
                      top: rect.bottom + 8,
                      left: leftPosition
                    });


                    setSelectedProduct(item);
                    setShowMenu(true);

                  }}
                >
                  ⋮
                </button>

                <h3 className="product-name">
                  {item.product_name}
                </h3>

                <p className="product-brand">
                  {item.brand}
                </p>

                <p className="product-shade">
                  {item.shade || "-"}
                </p>
              </div>
            ))}
          </div>

        )}

        <button
          className="add-btn"
          onClick={() => {
            resetForm();
            setShowForm(true);
          }}
        >
          ＋
        </button>

        {showMenu && (
          <div
            className="popup-menu"
            style={{
              top: menuPosition.top,
              left: menuPosition.left
            }}
            onClick={(e)=>e.stopPropagation()}
          >

            <button
              onClick={() => {
                setForm({
                  product_name: selectedProduct.product_name,
                  brand: selectedProduct.brand,
                  category: selectedProduct.category,
                  shade: selectedProduct.shade || "",
                  manufacture_date: selectedProduct.manufacture_date || "",
                  expire_months: selectedProduct.expire_months || "",
                  expire_date: selectedProduct.expire_date || ""
                });

                setDateMode(selectedProduct.date_mode || "manufacture");

                setEditMode(true);
                setShowMenu(false);
                setShowForm(true);
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
              value={form.product_name}
              placeholder="名稱"
              onChange={handleChange}
            />

            <input
              name="brand"
              value={form.brand}
              placeholder="品牌"
              onChange={handleChange}
            />

            <input
              name="shade"
              value={form.shade}
              placeholder="色號"
              onChange={handleChange}
            />

            <input
              name="category"
              value={form.category}
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
                  value={form.manufacture_date}
                  onChange={handleChange}
                />

                <input
                  type="number"
                  name="expire_months"
                  value={form.expire_months}
                  placeholder="保存(月)"
                  onChange={handleChange}
                />
              </>
            ) : (
              <input
                type="date"
                name="expire_date"
                value={form.expire_date}
                onChange={handleChange}
              />
            )}

            <button
              onClick={editMode ? updateProduct : createProduct}
            >
              {editMode ? "儲存修改" : "新增"}
            </button>

          </div>
        )}

      </div>

    </div>
  );
}

export default Cosmetics;