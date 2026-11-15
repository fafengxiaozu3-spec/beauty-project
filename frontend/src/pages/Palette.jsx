import { useState, useEffect } from "react";
import Sidebar from "../components/Sidebar";
import Header from "../components/Header";
import { initLiff } from "../services/liff";

const colorGroups = [
  "全部",
  "粉色系",
  "紅色系",
  "橘色系",
  "棕色系",
  "其他色系"
];

function getColorGroup(hex) {
  if (!/^#[0-9a-fA-F]{6}$/.test(hex || "")) {
    return "其他色系";
  }

  const r = parseInt(hex.slice(1, 3), 16) / 255;
  const g = parseInt(hex.slice(3, 5), 16) / 255;
  const b = parseInt(hex.slice(5, 7), 16) / 255;

  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const delta = max - min;

  let hue = 0;

  if (delta !== 0) {
    if (max === r) {
      hue = ((g - b) / delta) % 6;
    } else if (max === g) {
      hue = (b - r) / delta + 2;
    } else {
      hue = (r - g) / delta + 4;
    }

    hue = (hue * 60 + 360) % 360;
  }

  // HSL 飽和度與亮度
  const lightness = (max + min) / 2;

  const saturation =
    delta === 0
      ? 0
      : delta / (1 - Math.abs(2 * lightness - 1));

  // 棕色系：偏暗或低飽和的暖色
  if (
    (hue < 65 || hue >= 345) &&
    lightness < 0.58 &&
    saturation < 0.5
  ) {
    return "棕色系";
  }

  // 粉色系
  if (
    (hue >= 320 || hue < 10) &&
    lightness >= 0.65
  ) {
    return "粉色系";
  }

  // 橘色系：包含偏紅的陶土橘
  if (hue >= 10 && hue < 65) {
    return "橘色系";
  }

  // 紅色系
  if (hue >= 345 || hue < 10) {
    return "紅色系";
  }

  return "其他色系";
}


function Palette() {
  const [menuOpen, setMenuOpen] = useState(false);

  // 從後端取得的色卡資料
  const [colors, setColors] = useState([]);

  // 載入狀態
  const [loadingColors, setLoadingColors] = useState(true);

  // 錯誤訊息
  const [loadError, setLoadError] = useState("");

  // 顏色分類
  const [activeGroup, setActiveGroup] = useState("全部");

  // 選取的產品
  const [selectedColor, setSelectedColor] = useState(null);

  function toggleMenu() {
    setMenuOpen((prev) => !prev);
  }

  useEffect(() => {
    async function loadColors() {
      setLoadingColors(true);
      setLoadError("");

      try {
        const profile = await initLiff();

        if (!profile) {
          throw new Error("無法取得使用者資料");
        }

        const userId = profile.userId;

        const response = await fetch(
          `https://mybeautystudio-backend.onrender.com/api/products?user_id=${encodeURIComponent(userId)}&product_type=cosmetics`
        );

        if (!response.ok) {
          throw new Error("取得化妝品資料失敗");
        }

        const data = await response.json();

        if (!Array.isArray(data)) {
          throw new Error("後端回傳的資料格式不正確");
        }

        // 只保留有 AI 辨識色碼的唇彩與腮紅
        const paletteProducts = data
          .filter((item) => {
            const validCategory =
              item.category === "唇彩" ||
              item.category === "腮紅";

            const validColor =
              /^#[0-9a-fA-F]{6}$/.test(
                item.color_hex || ""
              );

            return validCategory && validColor;
          })
          .map((item) => ({
            ...item,
            color_group: getColorGroup(item.color_hex)
          }));

        setColors(paletteProducts);

      } catch (error) {
        console.error("取得色卡失敗：", error);
        setLoadError(error.message || "色卡載入失敗");

      } finally {
        setLoadingColors(false);
      }
    }

    loadColors();
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
            {loadingColors
              ? "正在載入色卡..."
              : loadError
                ? loadError
                : `共 ${filteredColors.length} 款顏色`}
          </div>

          {/* 資料載入完成後才顯示色卡 */}
          {!loadingColors && !loadError && (
            <>
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

        </>
      )}

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
