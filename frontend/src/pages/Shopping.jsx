import { useState, useEffect } from "react";
import Sidebar from "../components/Sidebar";
import Header from "../components/Header";
import { initLiff } from "../services/liff";

function Shopping() {
  const [menuOpen, setMenuOpen] = useState(false);

  const [items, setItems] = useState([]);
  const [loadingItems, setLoadingItems] = useState(true);

  const [showForm, setShowForm] = useState(false);
  const [showDetail, setShowDetail] = useState(false);

  const [selectedItem, setSelectedItem] = useState(null);
  const [editMode, setEditMode] = useState(false);

  const [form, setForm] = useState({
    item_name: "",
    brand: "",
    category: "",
    source: "",
    note: ""
  });

  function toggleMenu() {
    setMenuOpen((prev) => !prev);
  }

  function resetForm() {
    setEditMode(false);

    setForm({
      item_name: "",
      brand: "",
      category: "",
      source: "",
      note: ""
    });
  }

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

  useEffect(() => {
    async function start() {
      const profile = await initLiff();

      if (!profile) {
        setLoadingItems(false);
        return;
      }

      loadShoppingList(profile.userId);
    }

    start();
  }, []);

  // =========================
  // 取得購物清單
  // =========================

  async function loadShoppingList(userId) {
    setLoadingItems(true);

    try {
      const res = await fetch(
        `https://mybeautystudio-backend.onrender.com/api/shopping-list?user_id=${userId}`
      );

      const data = await res.json();

      setItems(data);
    } catch (err) {
      console.log("取得購物清單失敗:", err);
    } finally {
      setLoadingItems(false);
    }
  }

  // =========================
  // 輸入
  // =========================

  function handleChange(e) {
    setForm({
      ...form,
      [e.target.name]: e.target.value
    });
  }

  // =========================
  // 新增
  // =========================

  async function createItem() {
    try {
      const userId = localStorage.getItem("lineUserId");

      await fetch(
        "https://mybeautystudio-backend.onrender.com/api/shopping-list",
        {
          method: "POST",

          headers: {
            "Content-Type": "application/json"
          },

          body: JSON.stringify({
            user_id: userId,
            item_name: form.item_name,
            brand: form.brand,
            category: form.category,
            source: form.source,
            note: form.note
          })
        }
      );

      setShowForm(false);
      resetForm();

      loadShoppingList(userId);
    } catch (err) {
      console.log("新增購物清單失敗:", err);
    }
  }

  // =========================
  // 點擊購物項目
  // =========================

  function openDetail(item) {
    setSelectedItem(item);
    setShowDetail(true);
  }

  // =========================
  // 刪除
  // =========================

  async function deleteItem() {
    if (!selectedItem) return;

    const confirmDelete = window.confirm(
      `確定要刪除 ${selectedItem.brand || ""} ${selectedItem.item_name} 嗎？`
    );

    if (!confirmDelete) return;

    try {
      await fetch(
        `https://mybeautystudio-backend.onrender.com/api/shopping-list/${selectedItem.id}`,
        {
          method: "DELETE"
        }
      );

      const userId = localStorage.getItem("lineUserId");

      setShowDetail(false);
      setSelectedItem(null);

      loadShoppingList(userId);
    } catch (err) {
      console.log("刪除購物清單失敗:", err);
    }
  }

  // =========================
  // 開啟編輯
  // =========================

  function openEdit() {
    if (!selectedItem) return;

    setForm({
      item_name: selectedItem.item_name || "",
      brand: selectedItem.brand || "",
      category: selectedItem.category || "",
      source: selectedItem.source || "",
      note: selectedItem.note || ""
    });

    setEditMode(true);
    setShowDetail(false);
    setShowForm(true);
  }

  // =========================
  // 編輯
  // =========================

  async function updateItem() {
    if (!selectedItem) return;

    try {
      await fetch(
        `https://mybeautystudio-backend.onrender.com/api/shopping-list/${selectedItem.id}`,
        {
          method: "PATCH",

          headers: {
            "Content-Type": "application/json"
          },

          body: JSON.stringify({
            item_name: form.item_name,
            brand: form.brand,
            category: form.category,
            source: form.source,
            note: form.note
          })
        }
      );

      const userId = localStorage.getItem("lineUserId");

      setShowForm(false);
      setSelectedItem(null);
      resetForm();

      loadShoppingList(userId);
    } catch (err) {
      console.log("修改購物清單失敗:", err);
    }
  }

  return (
    <div className="layout">

      <Sidebar
        active="shopping"
        menuOpen={menuOpen}
        toggleMenu={toggleMenu}
      />

      {/* =========================
          新增 / 編輯背景
      ========================= */}

      {showForm && (
        <div
          className="popup-overlay"
          onClick={() => {
            setShowForm(false);
            resetForm();
          }}
        />
      )}

      {/* =========================
          詳細內容背景
      ========================= */}

      {showDetail && (
        <div
          className="popup-overlay"
          onClick={() => {
            setShowDetail(false);
            setSelectedItem(null);
          }}
        />
      )}

      <div className="main">

        <Header
          title="購物清單🛒"
          toggleMenu={toggleMenu}
        />

        {/* =========================
            Loading
        ========================= */}

        {loadingItems ? (

          <div className="product-loading">
            <div className="loading-circle"></div>
            <p>正在取得你的購物清單...</p>
          </div>

        ) : (

          <div className="shopping-list">

            {items.length === 0 ? (

              <div className="shopping-empty">
                <p>目前還沒有購物清單 🛒</p>
              </div>

            ) : (

              items.map((item) => (

                <div
                  key={item.id}
                  className="shopping-item"
                  onClick={() => openDetail(item)}
                >

                  <div className="shopping-info">

                    <span className="shopping-brand">
                      {item.brand}
                    </span>

                    <span className="shopping-name">
                      {item.item_name}
                    </span>

                    {item.category && (
                      <span className="shopping-category">
                        {item.category}
                      </span>
                    )}

                  </div>

                  <div className="shopping-arrow">
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
            詳細內容
        ========================= */}

        {showDetail && selectedItem && (

          <div
            className="shopping-detail"
            onClick={(e) => e.stopPropagation()}
          >

            <button
              className="shopping-detail-close"
              onClick={() => {
                setShowDetail(false);
                setSelectedItem(null);
              }}
            >
              ×
            </button>

            <div className="shopping-detail-header">

              <div className="shopping-detail-icon">
                🛒
              </div>

              <div className="shopping-detail-title">

                <p>
                  {selectedItem.brand}
                </p>

                <h2>
                  {selectedItem.item_name}
                </h2>

              </div>

            </div>

            <div className="shopping-detail-info">

              <div className="shopping-detail-row">
                <span>分類</span>
                <strong>
                  {selectedItem.category || "未分類"}
                </strong>
              </div>

              <div className="shopping-detail-row">
                <span>購買來源</span>
                <strong>
                  {selectedItem.source || "未填寫"}
                </strong>
              </div>

              <div className="shopping-detail-row">
                <span>備註</span>
                <strong>
                  {selectedItem.note || "沒有備註"}
                </strong>
              </div>

            </div>

            <div className="shopping-detail-actions">

              <button
                className="shopping-edit-btn"
                onClick={openEdit}
              >
                ✏️ 編輯
              </button>

              <button
                className="shopping-delete-btn"
                onClick={deleteItem}
              >
                🗑️ 刪除
              </button>

            </div>

          </div>

        )}

        {/* =========================
            新增 / 編輯視窗
        ========================= */}

        {showForm && (

          <div
            className="popup"
            onClick={(e) => e.stopPropagation()}
          >

            <button
              className="detail-close"
              onClick={() => {
                setShowForm(false);
                resetForm();
              }}
            >
              ×
            </button>

            <h2>
              {editMode ? "編輯購物清單" : "新增購物清單"}
            </h2>

            <input
              name="item_name"
              value={form.item_name}
              placeholder="商品名稱"
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

            <input
              name="source"
              value={form.source}
              placeholder="來源"
              onChange={handleChange}
            />

            <input
              name="note"
              value={form.note}
              placeholder="備註"
              onChange={handleChange}
            />

            <button
              className="form-submit-btn"
              onClick={
                editMode
                  ? updateItem
                  : createItem
              }
            >
              {editMode ? "儲存修改" : "新增"}
            </button>

          </div>

        )}

      </div>

    </div>
  );
}

export default Shopping;