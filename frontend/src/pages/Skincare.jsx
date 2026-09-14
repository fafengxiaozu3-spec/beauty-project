import { useState, useEffect } from "react";
import Sidebar from "../components/Sidebar";
import Header from "../components/Header";
import { initLiff } from "../services/liff";

function Skincare() {
  const [menuOpen, setMenuOpen] = useState(false);

  const [products, setProducts] = useState([]);
  const [loadingProducts, setLoadingProducts] = useState(true);

  const [showForm, setShowForm] = useState(false);

  // 詳細資料
  const [showDetail, setShowDetail] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState(null);

  // 編輯模式
  const [editMode, setEditMode] = useState(false);

  // 搜尋
  const [showSearch, setShowSearch] = useState(false);
  const [searchText, setSearchText] = useState("");

  const [form, setForm] = useState({
    product_name: "",
    brand: "",
    category: "",
    manufacture_date: "",
    expire_months: "",
    expire_date: ""
  });

  const [dateMode, setDateMode] = useState("manufacture");

  function toggleMenu() {
    setMenuOpen((prev) => !prev);
  }

  // =========================
  // 重設表單
  // =========================

  function resetForm() {
    setEditMode(false);

    setForm({
      product_name: "",
      brand: "",
      category: "",
      manufacture_date: "",
      expire_months: "",
      expire_date: ""
    });

    setDateMode("manufacture");
  }

  // =========================
  // 取得保養品
  // =========================

  useEffect(() => {
    async function start() {
      const profile = await initLiff();

      if (!profile) return;

      loadProducts(profile.userId);
    }

    start();
  }, []);

  // =========================
  // 控制背景不能滑動
  // =========================

  useEffect(() => {
    if (showForm || showDetail) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }

    return () => {
      document.body.style.overflow = "";
    };
  }, [showForm, showDetail]);

  // =========================
  // 取得產品
  // =========================

  async function loadProducts(userId) {
    setLoadingProducts(true);

    try {
      const res = await fetch(
        `https://mybeautystudio-backend.onrender.com/api/products?user_id=${userId}&product_type=skincare`
      );

      const data = await res.json();

      setProducts(data);
    } catch (err) {
      console.log(err);
    } finally {
      setLoadingProducts(false);
    }
  }

  // =========================
  // 表單輸入
  // =========================

  function handleChange(e) {
    setForm({
      ...form,
      [e.target.name]: e.target.value
    });
  }

  // =========================
  // 新增保養品
  // =========================

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

            product_type: "skincare",

            product_name: form.product_name,
            brand: form.brand,
            category: form.category,

            date_mode: dateMode,

            manufacture_date:
              dateMode === "manufacture"
                ? form.manufacture_date
                : null,

            expire_months:
              dateMode === "manufacture"
                ? Number(form.expire_months)
                : null,

            expire_date:
              dateMode === "direct"
                ? form.expire_date
                : null
          })
        }
      );

      setShowForm(false);

      resetForm();

      loadProducts(userId);
    } catch (err) {
      console.log(err);
    }
  }

  // =========================
  // 刪除產品
  // =========================

  async function deleteProduct() {
    if (!selectedProduct) return;

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

      const userId = localStorage.getItem("lineUserId");

      await loadProducts(userId);

      setShowDetail(false);
      setSelectedProduct(null);
    } catch (err) {
      console.log(err);
    }
  }

  // =========================
  // 更新產品
  // =========================

  async function updateProduct() {
    if (!selectedProduct) return;

    try {
      await fetch(
        `https://mybeautystudio-backend.onrender.com/api/products/${selectedProduct.id}`,
        {
          method: "PATCH",

          headers: {
            "Content-Type": "application/json"
          },

          body: JSON.stringify({
            product_type: "skincare",

            product_name: form.product_name,
            brand: form.brand,
            category: form.category,

            date_mode: dateMode,

            manufacture_date:
              dateMode === "manufacture"
                ? form.manufacture_date
                : null,

            expire_months:
              dateMode === "manufacture"
                ? Number(form.expire_months)
                : null,

            expire_date:
              dateMode === "direct"
                ? form.expire_date
                : null
          })
        }
      );

      const userId = localStorage.getItem("lineUserId");

      await loadProducts(userId);

      setEditMode(false);
      setShowForm(false);
      setShowDetail(false);
      setSelectedProduct(null);
    } catch (err) {
      console.log(err);
    }
  }

  // =========================
  // 搜尋
  // =========================

  const filteredProducts = products.filter((item) => {
    const keyword = searchText.toLowerCase();

    return (
      (item.product_name || "")
        .toLowerCase()
        .includes(keyword) ||

      (item.brand || "")
        .toLowerCase()
        .includes(keyword) ||

      (item.category || "")
        .toLowerCase()
        .includes(keyword)
    );
  });

  // =========================
  // 關閉搜尋
  // =========================

  function closeSearch() {
    setSearchText("");
    setShowSearch(false);
  }

  return (
    <div className="layout">

      <Sidebar
        active="skincare"
        menuOpen={menuOpen}
        toggleMenu={toggleMenu}
      />

      <div
        className="main"
        onClick={() => {
          if (showSearch) {
            closeSearch();
          }
        }}
      >

        {/* =========================
            Header
        ========================= */}

        <Header
          title="我的保養品🧴"
          toggleMenu={toggleMenu}
          showSearchButton={true}
        >

          {!showSearch ? (

            <button
              className="search-btn"
              onClick={(e) => {
                e.stopPropagation();
                setShowSearch(true);
              }}
            >
              <svg
                viewBox="0 0 24 24"
                width="22"
                height="22"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <circle
                  cx="11"
                  cy="11"
                  r="7"
                />

                <line
                  x1="16.65"
                  y1="16.65"
                  x2="21"
                  y2="21"
                />
              </svg>
            </button>

          ) : (

            <div
              className="search-bar"
              onClick={(e) => e.stopPropagation()}
            >

              <input
                autoFocus
                placeholder="搜尋品牌、分類、產品..."
                value={searchText}
                onChange={(e) =>
                  setSearchText(e.target.value)
                }
              />

              <button
                className="search-close"
                onClick={closeSearch}
              >
                ✕
              </button>

            </div>

          )}

        </Header>


        {/* =========================
            商品 Loading
        ========================= */}

        {loadingProducts ? (

          <div className="product-loading">

            <div className="loading-circle"></div>

            <p>
              正在取得你的保養品資料...
            </p>

          </div>

        ) : (

          /* =========================
             商品列表
          ========================= */

          <div className="cosmetics-list">

            {filteredProducts.length === 0 ? (

              <div className="shopping-empty">
                {searchText
                  ? "找不到符合的保養品❌"
                  : "目前還沒有保養品😭"}
              </div>

            ) : (

              filteredProducts.map((item) => (
                <div
                  key={item.id}
                  className="cosmetic-card"
                  onClick={() => {
                    setSelectedProduct(item);
                    setShowDetail(true);
                  }}
                >
                  <div className="cosmetic-photo">
                    🧴
                  </div>

                  <div className="cosmetic-info">
                    <p className="cosmetic-brand">
                      {item.brand || "未填品牌"}
                    </p>

                    <p className="cosmetic-name">
                      {item.product_name}
                    </p>

                    <p className="cosmetic-category">
                      {item.category || "未分類"}
                    </p>
                  </div>

                  <div className="cosmetic-arrow">
                    ›
                  </div>
                </div>
              ))

            )}

          </div>

        )}


        {/* =========================
            新增按鈕
        ========================= */}

        <button
          className="add-btn"
          onClick={() => {
            resetForm();
            setShowForm(true);
          }}
        >
          ＋
        </button>


        {/* =========================
            產品詳細資料
        ========================= */}

        {showDetail && selectedProduct && (

          <>

            <div
              className="product-detail-overlay"
              onClick={() => {
                setShowDetail(false);
                setSelectedProduct(null);
              }}
            />

            <div
              className="product-detail"
              onClick={(e) => e.stopPropagation()}
            >

              <button
                className="detail-close"
                onClick={() => {
                  setShowDetail(false);
                  setSelectedProduct(null);
                }}
              >
                ✕
              </button>


              <div className="detail-photo">
                <span>📷</span>
              </div>


              <p className="detail-brand">
                {selectedProduct.brand}
              </p>

              <h2>
                {selectedProduct.product_name}
              </h2>


              <div className="detail-info">

                <div>
                  <span>分類</span>

                  <strong>
                    {selectedProduct.category || "-"}
                  </strong>
                </div>


                <div>
                  <span>製造日期</span>

                  <strong>
                    {selectedProduct.manufacture_date || "-"}
                  </strong>
                </div>


                <div>
                  <span>保存期限</span>

                  <strong>
                    {selectedProduct.expire_months
                      ? `${selectedProduct.expire_months} 個月`
                      : "-"}
                  </strong>
                </div>


                <div>
                  <span>有效期限</span>

                  <strong>
                    {selectedProduct.expire_date || "-"}
                  </strong>
                </div>

              </div>


              <div className="detail-actions">

                <button
                  className="edit-product-btn"
                  onClick={() => {

                    setForm({
                      product_name:
                        selectedProduct.product_name,

                      brand:
                        selectedProduct.brand,

                      category:
                        selectedProduct.category,

                      manufacture_date:
                        selectedProduct.manufacture_date || "",

                      expire_months:
                        selectedProduct.expire_months || "",

                      expire_date:
                        selectedProduct.expire_date || ""
                    });

                    setDateMode(
                      selectedProduct.date_mode ||
                      "manufacture"
                    );

                    setEditMode(true);

                    setShowDetail(false);

                    setShowForm(true);
                  }}
                >
                  ✏️ 編輯
                </button>


                <button
                  className="delete-product-btn"
                  onClick={deleteProduct}
                >
                  🗑️ 刪除
                </button>

              </div>

            </div>

          </>

        )}


        {/* =========================
            新增 / 編輯表單
        ========================= */}

        {showForm && (

          <>

            <div
              className="popup-overlay"
              onClick={() => {
                setShowForm(false);
                resetForm();
              }}
            />


            <div
              className="popup"
              onClick={(e) => e.stopPropagation()}
            >

              <button
                className="form-close"
                onClick={() => {
                  setShowForm(false);
                  resetForm();
                }}
              >
                ✕
              </button>


              <h2>
                {editMode
                  ? "編輯保養品"
                  : "新增保養品"}
              </h2>


              {/* 照片 */}

              <div className="photo-upload">

                <div className="photo-upload-icon">
                  📷
                </div>

                <span>
                  新增產品照片
                </span>

              </div>


              <input
                name="product_name"
                value={form.product_name}
                placeholder="產品名稱"
                onChange={handleChange}
              />


              <input
                name="brand"
                value={form.brand}
                placeholder="品牌"
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
                onChange={(e) =>
                  setDateMode(e.target.value)
                }
              >

                <option value="manufacture">
                  製造日期 + 保存期限
                </option>

                <option value="direct">
                  直接輸入有效日期
                </option>

              </select>


              {dateMode === "manufacture" ? (

                <>

                  <div className="date-input-wrapper">

                    <span
                      className={`date-placeholder ${
                        form.manufacture_date
                          ? "has-value"
                          : ""
                      }`}
                    >
                      {form.manufacture_date ||
                        "請輸入日期"}
                    </span>

                    <input
                      type="date"
                      name="manufacture_date"
                      value={form.manufacture_date}
                      onChange={handleChange}
                    />

                  </div>


                  <input
                    type="number"
                    name="expire_months"
                    value={form.expire_months}
                    placeholder="保存期限（月）"
                    onChange={handleChange}
                  />

                </>

              ) : (

                <div className="date-input-wrapper">

                  <span
                    className={`date-placeholder ${
                      form.expire_date
                        ? "has-value"
                        : ""
                    }`}
                  >
                    {form.expire_date ||
                      "請輸入日期"}
                  </span>

                  <input
                    type="date"
                    name="expire_date"
                    value={form.expire_date}
                    onChange={handleChange}
                  />

                </div>

              )}


              <button
                className="form-submit-btn"
                onClick={
                  editMode
                    ? updateProduct
                    : createProduct
                }
              >
                {editMode
                  ? "儲存修改"
                  : "新增產品"}
              </button>

            </div>

          </>

        )}

      </div>

    </div>
  );
}

export default Skincare;