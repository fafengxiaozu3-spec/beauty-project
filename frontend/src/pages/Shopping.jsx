import { useState, useEffect } from "react";
import Sidebar from "../components/Sidebar";
import Header from "../components/Header";
import { initLiff } from "../services/liff";

function Shopping() {
  const [menuOpen, setMenuOpen] = useState(false);

  const [items, setItems] = useState([]);
  const [loadingItems, setLoadingItems] = useState(true);

  const [showForm, setShowForm] = useState(false);
  const [showMenu, setShowMenu] = useState(false);

  const [selectedItem, setSelectedItem] = useState(null);
  const [editMode, setEditMode] = useState(false);

  const [menuPosition, setMenuPosition] = useState({
    top: 0,
    left: 0
  });

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
    async function start() {
      const profile = await initLiff();

      if (!profile) return;

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
  // 刪除
  // =========================

  async function deleteItem() {
    const confirmDelete = window.confirm(
      `確定要刪除 ${selectedItem.brand} ${selectedItem.item_name} 嗎？`
    );

    if (!confirmDelete) return;

    try {
      await fetch(
        `https://mybeautystudio-backend.onrender.com/api/shopping-list/${selectedItem.id}`,
        {
          method: "DELETE"
        }
      );

      loadShoppingList(
        localStorage.getItem("lineUserId")
      );

      setShowMenu(false);

    } catch (err) {
      console.log("刪除購物清單失敗:", err);
    }
  }

  // =========================
  // 編輯
  // =========================

  async function updateItem() {
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

      loadShoppingList(
        localStorage.getItem("lineUserId")
      );

      setEditMode(false);
      setShowForm(false);

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
          點背景關閉
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

      {showMenu && (
        <div
          className="popup-overlay"
          onClick={() => setShowMenu(false)}
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
                >

                  <div className="shopping-info">

                    <span className="shopping-brand">
                      {item.brand}
                    </span>

                    <span className="shopping-name">
                      {item.item_name}
                    </span>

                  </div>

                  <button
                    className="more-btn"
                    onClick={(e) => {

                      const rect =
                        e.currentTarget.getBoundingClientRect();

                      const menuWidth = 100;

                      const screenWidth =
                        window.innerWidth;

                      let leftPosition =
                        rect.left - 20;

                      if (
                        rect.left + menuWidth >
                        screenWidth
                      ) {
                        leftPosition =
                          rect.right - menuWidth;
                      }

                      setMenuPosition({
                        top: rect.bottom + 8,
                        left: leftPosition
                      });

                      setSelectedItem(item);
                      setShowMenu(true);

                    }}
                  >
                    ⋮
                  </button>

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
            編輯 / 刪除選單
        ========================= */}

        {showMenu && (

          <div
            className="popup-menu"
            style={{
              top: menuPosition.top,
              left: menuPosition.left
            }}
            onClick={(e) =>
              e.stopPropagation()
            }
          >

            <button
              onClick={() => {

                setForm({
                  item_name:
                    selectedItem.item_name || "",

                  brand:
                    selectedItem.brand || "",

                  category:
                    selectedItem.category || "",

                  source:
                    selectedItem.source || "",

                  note:
                    selectedItem.note || ""
                });

                setEditMode(true);
                setShowMenu(false);
                setShowForm(true);

              }}
            >
              ✏️ 編輯
            </button>

            <button
              onClick={deleteItem}
            >
              🗑️ 刪除
            </button>

          </div>

        )}

        {/* =========================
            新增 / 編輯視窗
        ========================= */}

        {showForm && (

          <div
            className="popup"
            onClick={(e) =>
              e.stopPropagation()
            }
          >

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