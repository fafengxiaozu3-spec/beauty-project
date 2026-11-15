
import { useState, useEffect } from "react";
import Sidebar from "../components/Sidebar";
import Header from "../components/Header";
import { initLiff } from "../services/liff";

// =========================
// 測試色卡資料
// 未來改成從後端 API 取得
// =========================
const demoColors = [
  {
    id: 1,
    product_name: "柔霧唇釉",
    brand: "品牌 A",
    category: "唇彩",
    shade: "01",
    color_hex: "#C87585",
    color_group: "粉色系"
  },
  {
    id: 2,
    product_name: "絲絨口紅",
    brand: "品牌 B",
    category: "唇彩",
    shade: "05",
    color_hex: "#A93E51",
    color_group: "紅色系"
  },
  {
    id: 3,
    product_name: "單色眼影",
    brand: "品牌 C",
    category: "眼影",
    shade: "02",
    color_hex: "#C98960",
    color_group: "橘色系"
  },
  {
    id: 4,
    product_name: "奶茶腮紅",
    brand: "品牌 D",
    category: "腮紅",
    shade: "03",
    color_hex: "#B88C83",
    color_group: "棕色系"
  },
  {
    id: 5,
    product_name: "水光唇蜜",
    brand: "品牌 E",
    category: "唇彩",
    shade: "04",
    color_hex: "#E4A0AD",
    color_group: "粉色系"
  },
  {
    id: 6,
    product_name: "霧面唇膏",
    brand: "品牌 F",
    category: "唇彩",
    shade: "06",
    color_hex: "#963F4D",
    color_group: "紅色系"
  }
];

const colorGroups = [
  "全部",
  "粉色系",
  "紅色系",
  "橘色系",
  "棕色系"
];

function Palette() {
  const [menuOpen, setMenuOpen] = useState(false);

  // 色卡資料
  const [colors] = useState(demoColors);

  // 顏色分類
  const [activeGroup, setActiveGroup] = useState("全部");

  // 選取的產品
  const [selectedColor, setSelectedColor] = useState(null);

  function toggleMenu() {
    setMenuOpen((prev) => !prev);
  }

  useEffect(() => {
    initLiff();
  }, []);

  // =========================
  // 篩選色卡
  // =========================

  const filteredColors = colors.filter((item) => {
    const matchColor =
      activeGroup === "全部" ||
      item.color_group === activeGroup;

    const matchCategory =
      item.category === "唇彩" ||
      item.category === "腮紅";

    return matchColor && matchCategory;
  });

  const lipColors = filteredColors.filter(
    (item) => item.category === "唇彩"
  );

  const blushColors = filteredColors.filter(
    (item) => item.category === "腮紅"
  );

  // =========================
  // 控制背景不能滑動
  // =========================
  useEffect(() => {
    if (selectedColor) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }

    return () => {
      document.body.style.overflow = "";
    };
  }, [selectedColor]);

  return (
    <div className="layout">
      <Sidebar
        active="palette"
        menuOpen={menuOpen}
        toggleMenu={toggleMenu}
      />

      <div className="main">
        <Header
          title="我的色卡🎨"
          toggleMenu={toggleMenu}
        />

        <div className="palette-page">

          <div className="palette-intro">
            <h2>我的專屬色彩收藏</h2>
            <p>
              整理你的美妝產品顏色，
              輕鬆查看每一款色號。
            </p>
          </div>

          {/* 顏色分類 */}
          <div className="palette-filters">
            {colorGroups.map((group) => (
              <button
                key={group}
                type="button"
                className={`palette-filter-btn ${
                  activeGroup === group ? "active" : ""
                }`}
                onClick={() => setActiveGroup(group)}
              >
                {group}
              </button>
            ))}
          </div>

          {/* 色卡總數 */}
          <div className="palette-count">
            共 {filteredColors.length} 款顏色
          </div>

          {/* 唇彩色卡 */}
          <section className="palette-section">
            <div className="palette-section-header">
              <h3>💄 唇彩</h3>
              <span>{lipColors.length} 款</span>
            </div>

            {lipColors.length === 0 ? (
              <div className="palette-empty">
                <p>目前沒有此色系的唇彩產品</p>
              </div>
            ) : (
              <div className="palette-grid">
                {lipColors.map((item) => (
                  <button
                    type="button"
                    key={item.id}
                    className="palette-card"
                    onClick={() => setSelectedColor(item)}
                  >
                    <div
                      className="palette-card-color"
                      style={{
                        backgroundColor: item.color_hex
                      }}
                    />

                    <div className="palette-card-info">
                      <p className="palette-card-brand">
                        {item.brand}
                      </p>

                      <p className="palette-card-name">
                        {item.product_name}
                      </p>

                      <p className="palette-card-shade">
                        色號：{item.shade}
                      </p>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </section>

          {/* 腮紅色卡 */}
          <section className="palette-section">
            <div className="palette-section-header">
              <h3>🌸 腮紅</h3>
              <span>{blushColors.length} 款</span>
            </div>

            {blushColors.length === 0 ? (
              <div className="palette-empty">
                <p>目前沒有此色系的腮紅產品</p>
              </div>
            ) : (
              <div className="palette-grid">
                {blushColors.map((item) => (
                  <button
                    type="button"
                    key={item.id}
                    className="palette-card"
                    onClick={() => setSelectedColor(item)}
                  >
                    <div
                      className="palette-card-color"
                      style={{
                        backgroundColor: item.color_hex
                      }}
                    />

                    <div className="palette-card-info">
                      <p className="palette-card-brand">
                        {item.brand}
                      </p>

                      <p className="palette-card-name">
                        {item.product_name}
                      </p>

                      <p className="palette-card-shade">
                        色號：{item.shade}
                      </p>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </section>
        </div>


        {/* 色卡詳細資料 */}
        {selectedColor && (
          <>
            <div
              className="palette-detail-overlay"
              onClick={() => setSelectedColor(null)}
            />

            <div className="palette-detail">
              <button
                type="button"
                className="palette-detail-close"
                onClick={() => setSelectedColor(null)}
              >
                ✕
              </button>

              <h2>色卡詳細資料</h2>

              <div
                className="palette-detail-color"
                style={{
                  backgroundColor: selectedColor.color_hex
                }}
              />

              <div className="palette-detail-info">
                <div>
                  <span>產品名稱</span>
                  <strong>
                    {selectedColor.product_name}
                  </strong>
                </div>

                <div>
                  <span>品牌</span>
                  <strong>{selectedColor.brand}</strong>
                </div>

                <div>
                  <span>分類</span>
                  <strong>{selectedColor.category}</strong>
                </div>

                <div>
                  <span>色號</span>
                  <strong>{selectedColor.shade}</strong>
                </div>

                <div>
                  <span>HEX 色碼</span>
                  <strong>{selectedColor.color_hex}</strong>
                </div>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

export default Palette;
