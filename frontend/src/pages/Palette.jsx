import { useState, useEffect } from "react";
import Cropper from "react-easy-crop";
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

  // =========================
  // 棕色系
  // =========================
  if (
    (hue >= 10 && hue < 65) &&
    lightness < 0.58 &&
    saturation < 0.55
  ) {
    return "棕色系";
  }

  // =========================
  // 橘色系
  // =========================
  if (hue >= 15 && hue < 65) {
    return "橘色系";
  }

  // =========================
  // 粉色系
  // =========================
  if (
    (hue >= 330 || hue < 15) &&
    (
      lightness >= 0.65 ||
      (
        lightness >= 0.48 &&
        lightness < 0.65 &&
        saturation >= 0.15 &&
        saturation <= 0.55
      )
    )
  ) {
    return "粉色系";
  }

  // =========================
  // 紅色系
  // =========================
  if (hue >= 330 || hue < 15) {
    return "紅色系";
  }

  return "其他色系";
}


function hexToLab(hex) {
  const rgb = [1, 3, 5].map((i) => {
    let value = parseInt(hex.slice(i, i + 2), 16) / 255;

    return value <= 0.04045
      ? value / 12.92
      : ((value + 0.055) / 1.055) ** 2.4;
  });

  const [r, g, b] = rgb;

  const x = (r * 0.4124564 + g * 0.3575761 + b * 0.1804375) / 0.95047;
  const y = r * 0.2126729 + g * 0.7151522 + b * 0.072175;
  const z = (r * 0.0193339 + g * 0.119192 + b * 0.9503041) / 1.08883;

  const f = (t) =>
    t > 0.0088564517
      ? Math.cbrt(t)
      : t / (3 * (6 / 29) ** 2) + 4 / 29;

  const fx = f(x);
  const fy = f(y);
  const fz = f(z);

  return [
    116 * fy - 16,
    500 * (fx - fy),
    200 * (fy - fz)
  ];
}

function calculateColorDifference(hex1, hex2) {
  const lab1 = hexToLab(hex1);
  const lab2 = hexToLab(hex2);

  return Math.sqrt(
    lab1.reduce(
      (sum, value, index) =>
        sum + (value - lab2[index]) ** 2,
      0
    )
  );
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

  // AI 相似色比對
  const [showCompare, setShowCompare] = useState(false);
  const [compareCategory, setCompareCategory] = useState("唇彩");
  const [compareImage, setCompareImage] = useState("");
  const [compareCrop, setCompareCrop] = useState({ x: 0, y: 0 });
  const [compareZoom, setCompareZoom] = useState(1);
  const [comparePixels, setComparePixels] = useState(null);
  const [showCompareCrop, setShowCompareCrop] = useState(false);

  const [comparing, setComparing] = useState(false);
  const [compareResult, setCompareResult] = useState(null);
  const [compareError, setCompareError] = useState("");

  // =========================
  // 彈出視窗開啟時禁止背景捲動
  // =========================
  useEffect(() => {
    if (showCompare || showCompareCrop || selectedColor) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }

    return () => {
      document.body.style.overflow = "";
    };
  }, [showCompare, showCompareCrop, selectedColor]);

  
  function toggleMenu() {
    setMenuOpen((prev) => !prev);
  }

  function openCompare() {
    setCompareCategory("唇彩");
    setCompareResult(null);
    setCompareError("");
    setCompareImage("");
    setShowCompareCrop(false);
    setShowCompare(true);
  }

  function closeCompare() {
    if (comparing) return;

    setShowCompare(false);
    setShowCompareCrop(false);
    setCompareImage("");
    setCompareResult(null);
    setCompareError("");
  }

  function handleCompareImage(e) {
    const file = e.target.files?.[0];
    e.target.value = "";

    if (!file) return;

    if (!file.type.startsWith("image/")) {
      setCompareError("請選擇圖片檔案");
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      setCompareError("圖片大小不能超過 10 MB");
      return;
    }

    setCompareError("");
    setCompareResult(null);

    const reader = new FileReader();

    reader.onload = () => {
      setCompareImage(reader.result);
      setCompareCrop({ x: 0, y: 0 });
      setCompareZoom(1);
      setComparePixels(null);
      setShowCompareCrop(true);
    };

    reader.onerror = () => {
      setCompareError("照片讀取失敗，請重新拍攝");
    };

    reader.readAsDataURL(file);
  }

  function getCompareCroppedImage(imageSrc, pixelCrop) {
    return new Promise((resolve, reject) => {
      const image = new Image();

      image.onload = () => {
        const canvas = document.createElement("canvas");
        canvas.width = 800;
        canvas.height = 800;

        const ctx = canvas.getContext("2d");

        if (!ctx) {
          reject(new Error("無法處理圖片"));
          return;
        }

        ctx.drawImage(
          image,
          pixelCrop.x,
          pixelCrop.y,
          pixelCrop.width,
          pixelCrop.height,
          0,
          0,
          800,
          800
        );

        canvas.toBlob(
          (blob) => {
            if (!blob) {
              reject(new Error("圖片剪裁失敗"));
              return;
            }

            resolve(
              new File([blob], "compare-color.jpg", {
                type: "image/jpeg"
              })
            );
          },
          "image/jpeg",
          0.9
        );
      };

      image.onerror = () => reject(new Error("圖片載入失敗"));
      image.src = imageSrc;
    });
  }

  async function confirmCompareCrop() {
    if (!compareImage || !comparePixels || comparing) return;

    setComparing(true);
    setCompareError("");

    try {
      const croppedFile = await getCompareCroppedImage(
        compareImage,
        comparePixels
      );

      setShowCompareCrop(false);

      const userId = localStorage.getItem("lineUserId");

      if (!userId) {
        throw new Error("無法取得使用者資料，請重新登入");
      }

      const formData = new FormData();
      formData.append("image", croppedFile);
      formData.append(
        "category",
        compareCategory === "唇彩" ? "lipstick" : "blush"
      );
      formData.append("user_id", userId);

      const response = await fetch(
        "https://mybeautystudio-backend.onrender.com/api/analyze-color",
        {
          method: "POST",
          body: formData
        }
      );

      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(
          result.message || result.error || "AI 顏色辨識失敗"
        );
      }

      const detectedHex = result.color?.color_hex;

      if (!/^#[0-9a-fA-F]{6}$/.test(detectedHex || "")) {
        throw new Error("AI 未能辨識有效的顏色");
      }

      // 只比較相同類型的產品
      const sameCategoryColors = colors.filter(
        (item) => item.category === compareCategory
      );

      // 計算每個產品與掃描顏色的色差
      const matches = sameCategoryColors
        .map((item) => ({
          ...item,
          difference: calculateColorDifference(
            detectedHex,
            item.color_hex
          )
        }))
        .filter((item) => item.difference <= 10)
        .sort((a, b) => a.difference - b.difference);

      setCompareResult({
        category: compareCategory,
        detectedHex,
        matches,
        comparedCount: sameCategoryColors.length
      });

    } catch (error) {
      console.error("AI 相似色比對失敗：", error);
      setCompareError(error.message || "比對失敗，請重新拍攝");
    } finally {
      setComparing(false);
    }
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

    {/* AI 相似色掃描按鈕 */}
    <button
      type="button"
      className="palette-compare-fab"
      onClick={openCompare}
      aria-label="AI 相似色掃描"
    >
      <svg
        width="28"
        height="28"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden="true"
      >
        <path d="M8 3H5a2 2 0 0 0-2 2v3" />
        <path d="M16 3h3a2 2 0 0 1 2 2v3" />
        <path d="M21 16v3a2 2 0 0 1-2 2h-3" />
        <path d="M8 21H5a2 2 0 0 1-2-2v-3" />
        <circle cx="12" cy="12" r="4" />
      </svg>
    </button>  


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

      {/* AI 相似色比對視窗 */}
      {showCompare && (
        <div className="palette-compare-overlay">
          <div className="palette-compare-modal">
            <button
              type="button"
              className="palette-compare-close"
              onClick={closeCompare}
              disabled={comparing}
            >
              ✕
            </button>

            <h2>AI 即時辨識相似色號</h2>

            {!showCompareCrop && !compareResult && (
              <>
                <label className="palette-compare-label">
                  選擇產品類型
                </label>

                <div className="palette-compare-types">
                  {["唇彩", "腮紅"].map((category) => (
                    <button
                      key={category}
                      type="button"
                      className={
                        compareCategory === category ? "active" : ""
                      }
                      onClick={() => setCompareCategory(category)}
                      disabled={comparing}
                    >
                      {category}
                    </button>
                  ))}
                </div>

                <label
                  htmlFor="palette-compare-photo"
                  className="palette-compare-upload"
                >
                  {!comparing && (
                    <svg
                      width="20"
                      height="20"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="1.8"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      aria-hidden="true"
                    >
                      <path d="M8 3H5a2 2 0 0 0-2 2v3" />
                      <path d="M16 3h3a2 2 0 0 1 2 2v3" />
                      <path d="M21 16v3a2 2 0 0 1-2 2h-3" />
                      <path d="M8 21H5a2 2 0 0 1-2-2v-3" />
                      <circle cx="12" cy="12" r="4" />
                    </svg>
                  )}

                  <span>
                    {comparing ? "AI 辨識中..." : "拍照掃描顏色"}
                  </span>
                </label>

                <input
                  id="palette-compare-photo"
                  type="file"
                  accept="image/*"
                  capture="environment"
                  onChange={handleCompareImage}
                  disabled={comparing}
                  style={{ display: "none" }}
                />
              </>
            )}

            {showCompareCrop && compareImage && (
              <>
                <p className="palette-compare-hint">
                  請將剪裁範圍填滿要辨識的顏色，
                  避免背景影響結果。
                </p>

                <div className="palette-compare-crop-container">
                  <Cropper
                    image={compareImage}
                    crop={compareCrop}
                    zoom={compareZoom}
                    aspect={1}
                    onCropChange={setCompareCrop}
                    onZoomChange={setCompareZoom}
                    onCropComplete={(_, pixels) =>
                      setComparePixels(pixels)
                    }
                  />
                </div>

                <input
                  type="range"
                  min={1}
                  max={3}
                  step={0.01}
                  value={compareZoom}
                  onChange={(e) =>
                    setCompareZoom(Number(e.target.value))
                  }
                  className="palette-compare-zoom"
                />

                <div className="palette-compare-actions">
                  <button
                    type="button"
                    onClick={() => setShowCompareCrop(false)}
                  >
                    取消
                  </button>

                  <button
                    type="button"
                    onClick={confirmCompareCrop}
                    disabled={comparing || !comparePixels}
                  >
                    確認並辨識
                  </button>
                </div>
              </>
            )}

            {comparing && (
              <p className="palette-compare-loading">
                正在辨識顏色並與色卡比對...
              </p>
            )}

            {compareError && (
              <p className="palette-compare-error">
                {compareError}
              </p>
            )}

            {compareResult && (
              <div className="palette-compare-result">
                <h3>比對結果</h3>

                <p>產品類型：{compareResult.category}</p>

                <div className="palette-compare-detected">
                  <div
                    className="palette-compare-swatch"
                    style={{
                      backgroundColor: compareResult.detectedHex
                    }}
                  />
                  <span>
                    掃描顏色：{compareResult.detectedHex}
                  </span>
                </div>

                {compareResult.matches.length > 0 ? (
                  <>
                    <p className="palette-compare-warning">
                      你的色卡中已有相近的顏色，
                      購買前可以先比較現有產品！
                    </p>

                    {compareResult.matches.map((item) => (
                      <div
                        className="palette-compare-match"
                        key={item.id}
                      >
                        <div
                          className="palette-compare-swatch"
                          style={{
                            backgroundColor: item.color_hex
                          }}
                        />

                        <div>
                          <strong>{item.product_name}</strong>
                          <p>{item.brand}</p>
                          <p>色號：{item.shade}</p>
                          <p>HEX：{item.color_hex}</p>
                        </div>
                      </div>
                    ))}
                  </>
                ) : (
                  <p className="palette-compare-no-match">
                    {compareResult.comparedCount === 0
                      ? `目前色卡中沒有${compareResult.category}資料可供比對。`
                      : "目前沒有找到相近的顏色。"}
                  </p>
                )}

                <button
                  type="button"
                  className="palette-compare-retry"
                  onClick={() => {
                    setCompareResult(null);
                    setCompareError("");
                  }}
                >
                  再次掃描
                </button>
              </div>
            )}
          </div>
        </div>
      )}

    </div>
  );
}

export default Palette;
