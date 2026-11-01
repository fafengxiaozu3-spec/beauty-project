import { useState, useEffect } from "react";
import Cropper from "react-easy-crop";
import Sidebar from "../components/Sidebar";
import Header from "../components/Header";
import { initLiff } from "../services/liff";
function Skincare() {
  const [menuOpen, setMenuOpen] = useState(false);

  const [products, setProducts] = useState([]);
  const [loadingProducts, setLoadingProducts] = useState(true);

  const [showForm, setShowForm] = useState(false);
  
  // 商品照片
  const [selectedImage, setSelectedImage] = useState(null);
  const [imagePreview, setImagePreview] = useState("");

  // 照片剪裁
  const [showCrop, setShowCrop] = useState(false);
  const [cropImage, setCropImage] = useState("");
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState(null);

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

    if (imagePreview.startsWith("blob:")) {
      URL.revokeObjectURL(imagePreview);
    }

    setSelectedImage(null);
    setImagePreview("");

    setShowCrop(false);
    setCropImage("");
    setCrop({ x: 0, y: 0 });
    setZoom(1);
    setCroppedAreaPixels(null);

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
  // 選擇商品照片
  // =========================
  function handleImageChange(e) {
    const file = e.target.files?.[0];

    if (!file) return;

    if (!file.type.startsWith("image/")) {
      alert("請選擇圖片檔案");
      e.target.value = "";
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      alert("圖片大小不能超過 10 MB");
      e.target.value = "";
      return;
    }

    const reader = new FileReader();

    reader.onload = () => {
      setCropImage(reader.result);
      setCrop({ x: 0, y: 0 });
      setZoom(1);
      setCroppedAreaPixels(null);
      setShowCrop(true);
    };

    reader.readAsDataURL(file);

    e.target.value = "";
  }

  // =========================
  // 產生剪裁後的正方形照片
  // =========================
  async function getCroppedImage(imageSrc, pixelCrop) {
    const image = new Image();
    image.src = imageSrc;

    await new Promise((resolve, reject) => {
      image.onload = resolve;
      image.onerror = reject;
    });

    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");

    if (!ctx) {
      throw new Error("無法建立圖片剪裁畫布");
    }

    canvas.width = 600;
    canvas.height = 600;

    ctx.drawImage(
      image,
      pixelCrop.x,
      pixelCrop.y,
      pixelCrop.width,
      pixelCrop.height,
      0,
      0,
      600,
      600
    );

    const blob = await new Promise((resolve) => {
      canvas.toBlob(resolve, "image/jpeg", 0.9);
    });

    if (!blob) {
      throw new Error("照片剪裁失敗");
    }

    return new File(
      [blob],
      "product-photo.jpg",
      { type: "image/jpeg" }
    );
  }

  // =========================
  // 確認剪裁
  // =========================
  async function confirmCrop() {
    if (!cropImage || !croppedAreaPixels) return;

    try {
      const croppedFile = await getCroppedImage(
        cropImage,
        croppedAreaPixels
      );

      setSelectedImage(croppedFile);

      const previewUrl = URL.createObjectURL(croppedFile);

      if (imagePreview.startsWith("blob:")) {
        URL.revokeObjectURL(imagePreview);
      }

      setImagePreview(previewUrl);

      setShowCrop(false);
      setCropImage("");
      setCroppedAreaPixels(null);

    } catch (err) {
      console.error("剪裁照片失敗：", err);
      alert("照片剪裁失敗，請重新選擇圖片");
    }
  }

  // =========================
  // 新增保養品
  // =========================
  async function createProduct() {
    try {
      const userId = localStorage.getItem("lineUserId");

      if (!userId) {
        alert("無法取得使用者資料，請重新開啟頁面");
        return;
      }

      let imageUrl = "";

      // 1. 上傳剪裁後的照片
      if (selectedImage) {
        const imageData = new FormData();
        imageData.append("image", selectedImage);

        const uploadRes = await fetch(
          "https://mybeautystudio-backend.onrender.com/api/upload-image",
          {
            method: "POST",
            body: imageData
          }
        );

        if (!uploadRes.ok) {
          throw new Error("照片上傳失敗");
        }

        const uploadData = await uploadRes.json();

        if (!uploadData.image_url) {
          throw new Error("後端沒有回傳圖片網址");
        }

        imageUrl = uploadData.image_url;
      }

      // 2. 儲存保養品資料與照片網址
      const productRes = await fetch(
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
              dateMode === "manufacture" && form.expire_months
                ? Number(form.expire_months)
                : null,

            expire_date:
              dateMode === "direct"
                ? form.expire_date
                : null,

            image_url: imageUrl
          })
        }
      );

      if (!productRes.ok) {
        const errorText = await productRes.text();
        console.error("新增保養品失敗：", errorText);
        throw new Error("保養品資料儲存失敗");
      }

      setShowForm(false);
      resetForm();

      await loadProducts(userId);

    } catch (err) {
      console.error("新增保養品失敗：", err);
      alert(err.message || "新增失敗，請稍後再試");
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
                    {item.image_url ? (
                      <img
                        src={item.image_url}
                        alt={item.product_name}
                      />
                    ) : (
                      <span>🧴</span>
                    )}
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
                {selectedProduct.image_url ? (
                  <img
                    src={selectedProduct.image_url}
                    alt={selectedProduct.product_name}
                  />
                ) : (
                  <span>📷</span>
                )}
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

            <div className="form-header">
              <h2>
                {editMode
                  ? "編輯保養品"
                  : "新增保養品"}
              </h2>

              <button
                type="button"
                className="form-close"
                onClick={() => {
                  setShowForm(false);
                  resetForm();
                }}
              >
                ✕
              </button>
            </div>

              {/* 照片上傳 */}

              <label
                className="photo-upload"
                htmlFor="skincare-image"
              >
                {imagePreview ? (
                  <img
                    src={imagePreview}
                    alt="保養品照片預覽"
                    className="photo-upload-preview"
                  />
                ) : (
                  <>
                    <div className="photo-upload-icon">
                      📷
                    </div>

                    <span>新增產品照片</span>
                    <small>點擊選擇圖片</small>
                  </>
                )}
              </label>

              <input
                id="skincare-image"
                type="file"
                accept="image/*"
                hidden
                onChange={handleImageChange}
              />

              {imagePreview && (
                <button
                  type="button"
                  className="photo-remove-btn"
                  onClick={() => {
                    setSelectedImage(null);

                    if (imagePreview.startsWith("blob:")) {
                      URL.revokeObjectURL(imagePreview);
                    }

                    setImagePreview("");
                  }}
                >
                  移除照片
                </button>
              )}
              
              {/* 掃描辨識產品資訊 */}
              <div className="scan-section">
                <button
                  type="button"
                  className="scan-product-btn"
                  onClick={() => {
                    alert("掃描辨識功能即將推出！");
                  }}
                >
                  <span className="scan-icon">▣</span>
                  掃描辨識產品資訊
                </button>

                <p className="scan-hint">
                  拍攝產品包裝，自動填入下方資料
                </p>
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
        
        {/* =========================
            照片剪裁視窗
        ========================= */}

        {showCrop && cropImage && (
          <div className="crop-overlay">
            <div className="crop-modal">

              <h2>剪裁產品照片</h2>

              <div className="crop-container">
                <Cropper
                  image={cropImage}
                  crop={crop}
                  zoom={zoom}
                  aspect={1}
                  cropShape="rect"
                  showGrid={true}
                  onCropChange={setCrop}
                  onZoomChange={setZoom}
                  onCropComplete={(_, croppedPixels) => {
                    setCroppedAreaPixels(croppedPixels);
                  }}
                />
              </div>

              <div className="crop-zoom">
                <span>－</span>

                <input
                  type="range"
                  min={1}
                  max={3}
                  step={0.01}
                  value={zoom}
                  onChange={(e) =>
                    setZoom(Number(e.target.value))
                  }
                />

                <span>＋</span>
              </div>

              <div className="crop-actions">
                <button
                  type="button"
                  className="crop-cancel"
                  onClick={() => {
                    setShowCrop(false);
                    setCropImage("");
                    setCroppedAreaPixels(null);
                  }}
                >
                  取消
                </button>

                <button
                  type="button"
                  className="crop-confirm"
                  onClick={confirmCrop}
                >
                  確認剪裁
                </button>
              </div>

            </div>
          </div>
        )}


      </div>

    </div>
  );
}

export default Skincare;