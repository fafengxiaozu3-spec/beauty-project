import { useState, useEffect } from "react";
import Cropper from "react-easy-crop";
import Sidebar from "../components/Sidebar";
import Header from "../components/Header";
import { initLiff } from "../services/liff";

function Cosmetics() {
  const [menuOpen, setMenuOpen] = useState(false);

  const [products, setProducts] = useState([]);
  const [loadingProducts, setLoadingProducts] = useState(true);

  const [showForm, setShowForm] = useState(false);

  const [detectedColor, setDetectedColor] = useState("");
  const [analyzingColor, setAnalyzingColor] = useState(false);
  const [colorError, setColorError] = useState("");

  // 商品照片
  const [selectedImage, setSelectedImage] = useState(null);
  const [imagePreview, setImagePreview] = useState("");
  const [removeImage, setRemoveImage] = useState(false);

  // 照片剪裁
  const [showCrop, setShowCrop] = useState(false);
  const [cropImage, setCropImage] = useState("");
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState(null);
  
  // 區分產品照片剪裁與 AI 顏色辨識剪裁
  const [cropMode, setCropMode] = useState("product");

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
    shade: "",
    manufacture_date: "",
    expire_months: "",
    expire_date: ""
  });

  const [dateMode, setDateMode] = useState("manufacture");

  // =========================
  // OCR 商品資訊辨識
  // =========================
  const [showOcr, setShowOcr] = useState(false);
  const [ocrFrontImage, setOcrFrontImage] = useState(null);
  const [ocrLabelImage, setOcrLabelImage] = useState(null);
  const [analyzingProduct, setAnalyzingProduct] = useState(false);
  const [ocrError, setOcrError] = useState("");

  const [ocrFrontPreview, setOcrFrontPreview] = useState("");
  const [ocrLabelPreview, setOcrLabelPreview] = useState("");

  // =========================
  // OCR 正面照片預覽
  // =========================
  useEffect(() => {
    if (!ocrFrontImage) {
      setOcrFrontPreview("");
      return;
    }

    const url = URL.createObjectURL(ocrFrontImage);
    setOcrFrontPreview(url);

    return () => URL.revokeObjectURL(url);
  }, [ocrFrontImage]);

  // =========================
  // OCR 背面照片預覽
  // =========================
  useEffect(() => {
    if (!ocrLabelImage) {
      setOcrLabelPreview("");
      return;
    }

    const url = URL.createObjectURL(ocrLabelImage);
    setOcrLabelPreview(url);

    return () => URL.revokeObjectURL(url);
  }, [ocrLabelImage]);

  function toggleMenu() {
    setMenuOpen((prev) => !prev);
  }

  // =========================
  // 重設表單
  // =========================
  function resetForm() {
    setEditMode(false);

    // 清除 AI 顏色辨識結果與錯誤訊息
    setDetectedColor("");
    setColorError("");

    setForm({
      product_name: "",
      brand: "",
      category: "",
      shade: "",
      manufacture_date: "",
      expire_months: "",
      expire_date: ""
    });

    setSelectedImage(null);
    setImagePreview("");
    setRemoveImage(false);

    setDateMode("manufacture");
  }


  // =========================
  // 開啟 OCR 商品資訊掃描
  // =========================
  function openOcr() {
    setOcrFrontImage(null);
    setOcrLabelImage(null);
    setOcrError("");
    setShowOcr(true);
  }

  function closeOcr() {
    if (analyzingProduct) return;

    setShowOcr(false);
    setOcrFrontImage(null);
    setOcrLabelImage(null);
    setOcrError("");
  }

  // =========================
  // OCR 圖片檢查
  // =========================
  function handleOcrImage(e, type) {
    const file = e.target.files?.[0];
    e.target.value = "";

    if (!file) return;

    if (!file.type.startsWith("image/")) {
      setOcrError("請選擇圖片檔案");
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      setOcrError("單張圖片不能超過 10 MB");
      return;
    }

    setOcrError("");

    if (type === "front") {
      setOcrFrontImage(file);
    } else {
      setOcrLabelImage(file);
    }
  }

  // =========================
  // OCR 商品資訊辨識
  // =========================
  async function analyzeProductInfo() {
    if (analyzingProduct) return;

    if (!ocrFrontImage && !ocrLabelImage) {
      setOcrError("請至少上傳一張商品照片");
      return;
    }

    setAnalyzingProduct(true);
    setOcrError("");

    try {
      const formData = new FormData();

      if (ocrFrontImage) {
        formData.append("front_image", ocrFrontImage);
      }

      if (ocrLabelImage) {
        formData.append("label_image", ocrLabelImage);
      }

      const response = await fetch(
        "https://mybeautystudio-backend.onrender.com/api/analyze-product",
        {
          method: "POST",
          body: formData
        }
      );

      const result = await response.json();

      if (
        !response.ok ||
        !result.success ||
        !result.product
      ) {
        throw new Error(
          result.message ||
          result.error ||
          "商品資訊辨識失敗"
        );
      }

      const product = result.product;

      // 前端目前支援的化妝品分類
      const validCategories = [
        "唇彩",
        "腮紅",
        "眼影",
        "底妝",
        "眉彩",
        "其他"
      ];

      const recognizedCategory =
        typeof product.category === "string"
          ? product.category.trim()
          : "";

      // 不直接將未知分類填入 select
      const category = validCategories.includes(
        recognizedCategory
      )
        ? recognizedCategory
        : "";

      // OCR date_mode 轉成前端使用的格式
      let nextDateMode = "manufacture";

      if (product.date_mode === "direct") {
        nextDateMode = "direct";
      } else if (
        product.date_mode === "manufacture" ||
        product.date_mode === "calculate"
      ) {
        nextDateMode = "manufacture";
      } else if (
        product.expire_date &&
        !product.manufacture_date
      ) {
        nextDateMode = "direct";
      }

      // 將辨識結果填入原本表單
      setForm((prev) => ({
        ...prev,
        brand: product.brand || prev.brand,
        product_name:
          product.product_name || prev.product_name,
        category: category || prev.category,
        shade: product.shade || prev.shade,
        manufacture_date:
          product.manufacture_date || "",
        expire_months:
          product.expire_months ?? "",
        expire_date:
          product.expire_date || ""
      }));

      setDateMode(nextDateMode);

      // 如果分類改變，清除原本辨識的顏色
      if (category && category !== form.category) {
        setDetectedColor("");
        setColorError("");
      }

      // 關閉 OCR 視窗，返回新增表單
      setShowOcr(false);
      setOcrFrontImage(null);
      setOcrLabelImage(null);

    } catch (error) {
      console.error("OCR 商品辨識失敗：", error);
      setOcrError(
        error.message || "商品資訊辨識失敗，請重試"
      );
    } finally {
      setAnalyzingProduct(false);
    }
  }


  // =========================
  // 取得使用者化妝品
  // =========================
  useEffect(() => {
    async function start() {
      const profile = await initLiff();

      if (!profile) return;

      loadProducts(profile.userId);
    }

    start();
  }, []);

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

  async function loadProducts(userId) {
    setLoadingProducts(true);

    try {
      const res = await fetch(
        `https://mybeautystudio-backend.onrender.com/api/products?user_id=${userId}&product_type=cosmetics`
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
    const { name, value } = e.target;

    setForm((prev) => ({
      ...prev,
      [name]: value
    }));

    // 更換產品分類時，清除原本的辨識結果
    if (name === "category" && value !== form.category) {
      setDetectedColor("");
      setColorError("");
    }
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
      setCropMode("product");
      setCropImage(reader.result);
      setCrop({ x: 0, y: 0 });
      setZoom(1);
      setCroppedAreaPixels(null);
      setShowCrop(true);
    };

    reader.readAsDataURL(file);

    // 允許再次選擇同一張圖片
    e.target.value = "";
  }

  // =========================
  // 產生正方形剪裁照片
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

    const size = 800;

    canvas.width = size;
    canvas.height = size;

    ctx.drawImage(
      image,
      pixelCrop.x,
      pixelCrop.y,
      pixelCrop.width,
      pixelCrop.height,
      0,
      0,
      size,
      size
    );

    const blob = await new Promise((resolve) => {
      canvas.toBlob(resolve, "image/jpeg", 0.9);
    });

    if (!blob) {
      throw new Error("圖片剪裁失敗");
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

      if (cropMode === "color") {
        // AI 顏色辨識：使用裁切後的照片
        setShowCrop(false);
        setCropImage("");
        setCroppedAreaPixels(null);

        await analyzeColor(croppedFile);

      } else {
        // 原本的產品照片剪裁功能
        const preview = URL.createObjectURL(croppedFile);

        setSelectedImage(croppedFile);
        setImagePreview(preview);

        setShowCrop(false);
        setCropImage("");
        setCroppedAreaPixels(null);
      }

    } catch (error) {
      console.error("照片剪裁失敗：", error);

      if (cropMode === "color") {
        setColorError("照片剪裁失敗，請重新拍攝");
      } else {
        alert("照片剪裁失敗，請重新選擇圖片");
      }
    }
  }

  // =========================
  // 取消剪裁
  // =========================
  function cancelCrop() {
    setShowCrop(false);
    setCropImage("");
    setCroppedAreaPixels(null);
    setCrop({ x: 0, y: 0 });
    setZoom(1);
  }
  
  // =========================
  // 新增產品
  // =========================
  async function createProduct() {
    try {
      const userId = localStorage.getItem("lineUserId");

      if (!userId) {
        alert("無法取得使用者資料，請重新開啟頁面");
        return;
      }

      let imageUrl = "";

      // 1. 如果有選擇照片，先上傳照片
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

      // 2. 將商品資料和照片網址一起存進資料庫
      const productRes = await fetch(
        "https://mybeautystudio-backend.onrender.com/api/products",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json"
          },
          body: JSON.stringify({
            user_id: userId,
            product_type: "cosmetics",
            product_name: form.product_name,
            brand: form.brand,
            category: form.category,
            shade: form.shade,

             // AI 辨識的顏色
            color_hex: ["唇彩", "腮紅"].includes(form.category)
            ? detectedColor || null
            : null,

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
        console.error("新增商品失敗：", errorText);
        throw new Error("商品資料儲存失敗");
      }

      setShowForm(false);
      resetForm();

      await loadProducts(userId);

    } catch (err) {
      console.error("新增化妝品失敗：", err);
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

      loadProducts(userId);

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
      let imageUrl = selectedProduct.image_url || "";

      // 如果使用者移除照片
      if (removeImage) {
        imageUrl = "";
      }

      // 如果使用者選擇新照片，先上傳
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

      const productRes = await fetch(
        `https://mybeautystudio-backend.onrender.com/api/products/${selectedProduct.id}`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json"
          },
          body: JSON.stringify({
            product_name: form.product_name,
            brand: form.brand,
            category: form.category,
            shade: form.shade,

            color_hex: ["唇彩", "腮紅"].includes(form.category)
              ? detectedColor || null
              : null,

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
        throw new Error("更新商品失敗");
      }

      const userId = localStorage.getItem("lineUserId");

      await loadProducts(userId);

      setEditMode(false);
      setShowForm(false);
      setShowDetail(false);
      resetForm();

    } catch (err) {
      console.error("更新化妝品失敗：", err);
      alert(err.message || "更新失敗，請稍後再試");
    }
  }

  // =========================
  // 顏色辨識
  // =========================
  function handleColorImageChange(e) {
    const file = e.target.files?.[0];

    if (!file) return;

    if (!file.type.startsWith("image/")) {
      setColorError("請選擇圖片檔案");
      e.target.value = "";
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      setColorError("圖片大小不能超過 10 MB");
      e.target.value = "";
      return;
    }

    setColorError("");

    const reader = new FileReader();

    reader.onload = () => {
      setCropMode("color");
      setCropImage(reader.result);
      setCrop({ x: 0, y: 0 });
      setZoom(1);
      setCroppedAreaPixels(null);
      setShowCrop(true);
    };

    reader.onerror = () => {
      setColorError("照片讀取失敗，請重新拍攝");
    };

    reader.readAsDataURL(file);

    e.target.value = "";
  }


  async function analyzeColor(file) {
    const categoryMap = {
      唇彩: "lipstick",
      腮紅: "blush"
    };

    const apiCategory = categoryMap[form.category];

    if (!apiCategory) {
      setColorError("目前只支援唇彩與腮紅辨識");
      return;
    }

    setAnalyzingColor(true);
    setColorError("");
    setDetectedColor("");

    try {
      const userId = localStorage.getItem("lineUserId");

      if (!userId) {
        throw new Error("無法取得使用者資料，請重新開啟頁面");
      }

      const formData = new FormData();

      formData.append("image", file);
      formData.append("category", apiCategory);
      formData.append("user_id", userId);

      const response = await fetch(
        "https://mybeautystudio-backend.onrender.com/api/analyze-color",
        {
          method: "POST",
          body: formData
        }
      );

      const result = await response.json();

      if (
        !response.ok ||
        !result.success ||
        !/^#[0-9a-fA-F]{6}$/.test(result.color?.color_hex || "")
      ) {
        throw new Error(
          result.message ||
          result.error ||
          "顏色辨識失敗"
        );
      }

      setDetectedColor(result.color.color_hex);

    } catch (error) {
      console.error("AI 顏色辨識失敗：", error);
      setColorError(error.message || "顏色辨識失敗，請重試");

    } finally {
      setAnalyzingColor(false);
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
        .includes(keyword) ||

      (item.shade || "")
        .toLowerCase()
        .includes(keyword)
    );
  });

  return (
    <div className="layout">

      <Sidebar
        active="cosmetics"
        menuOpen={menuOpen}
        toggleMenu={toggleMenu}
      />

      <div
        className="main"
        onClick={() => {

          if (showSearch) {
            setSearchText("");
            setShowSearch(false);
          }

        }}
      >

        {/* =========================
            Header
        ========================= */}

        <Header
          title="我的化妝品💄"
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
                onClick={() => {
                  setSearchText("");
                  setShowSearch(false);
                }}
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
              正在取得你的化妝品資料...
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
                  ? "找不到符合的化妝品❌"
                  : "目前還沒有化妝品😢"}
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
                    <span>📷</span>
                  )}
                </div>


                  <div className="cosmetic-info">

                    <p className="cosmetic-brand">
                      {item.brand}
                    </p>

                    <h3 className="cosmetic-name">
                      {item.product_name}
                    </h3>

                    <p className="cosmetic-category">
                      {item.category}
                      {item.shade
                        ? ` ・ ${item.shade}`
                        : ""}
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
                  <span>色號</span>
                  <strong>
                    {selectedProduct.shade || "-"}
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

                      shade:
                        selectedProduct.shade || "",

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

                    // 帶入原本的產品照片
                    setSelectedImage(null);
                    setImagePreview(selectedProduct.image_url || "");

                    // 重設照片移除狀態
                    setRemoveImage(false);

                    // 帶入原本的辨識顏色
                    setDetectedColor(selectedProduct.color_hex || "");

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
                  ? "編輯化妝品"
                  : "新增化妝品"}
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

              <label className="photo-upload" htmlFor="product-image">
                {imagePreview ? (
                  <img
                    src={imagePreview}
                    alt="商品照片預覽"
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
                id="product-image"
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
                    if (imagePreview.startsWith("blob:")) {
                      URL.revokeObjectURL(imagePreview);
                    }

                    setSelectedImage(null);
                    setImagePreview("");
                    setRemoveImage(true);

                    const input = document.getElementById("product-image");
                    if (input) input.value = "";
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
                  onClick={openOcr}
                >
                  <svg
                    className="scan-icon"
                    width="22"
                    height="22"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d="M4 8V5a1 1 0 0 1 1-1h3" />
                    <path d="M16 4h3a1 1 0 0 1 1 1v3" />
                    <path d="M20 16v3a1 1 0 0 1-1 1h-3" />
                    <path d="M8 20H5a1 1 0 0 1-1-1v-3" />
                    <path d="M4 12h16" />
                  </svg>
                  
                  掃描自動輸入產品資訊
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

              
              {/* =========================
                  色號與辨識顏色
              ========================= */}

              <div className="shade-input-wrapper">
                <input
                  name="shade"
                  value={form.shade}
                  placeholder="色號"
                  onChange={handleChange}
                />

                {detectedColor && (
                  <span
                    className="shade-color-circle"
                    style={{ backgroundColor: detectedColor }}
                    title={`辨識顏色：${detectedColor}`}
                  />
                )}
              </div>

              {/* =========================
                  拍攝辨識產品顏色
              ========================= */}

              {["唇彩", "腮紅"].includes(form.category) && (
                <div className="color-scan-section">

                  <label
                    htmlFor="color-scan-image"
                    className="color-scan-btn"
                    style={{
                      opacity: analyzingColor ? 0.6 : 1,
                      pointerEvents: analyzingColor ? "none" : "auto"
                    }}
                  >
                    <svg
                      width="22"
                      height="22"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <path d="M4 8V5a1 1 0 0 1 1-1h3" />
                      <path d="M16 4h3a1 1 0 0 1 1 1v3" />
                      <path d="M20 16v3a1 1 0 0 1-1 1h-3" />
                      <path d="M8 20H5a1 1 0 0 1-1-1v-3" />
                      <circle cx="12" cy="12" r="3" />
                    </svg>

                    {analyzingColor ? "AI 辨識中..." : "拍照辨識顏色"}
                  </label>

                  <input
                    id="color-scan-image"
                    type="file"
                    accept="image/*"
                    capture="environment"
                    onChange={handleColorImageChange}
                    disabled={analyzingColor}
                    style={{ display: "none" }}
                  />

                  {detectedColor && (
                    <p className="detected-color-text">
                      已辨識顏色：{detectedColor}
                    </p>
                  )}

                  {colorError && (
                    <p className="detected-color-text" style={{ color: "#c44" }}>
                      {colorError}
                    </p>
                  )}

                </div>
              )}


              {/* =========================
                  分類
              ========================= */}
              <select
                name="category"
                value={form.category}
                onChange={handleChange}
              >
                <option value="">請選擇產品分類</option>
                <option value="唇彩">唇彩</option>
                <option value="腮紅">腮紅</option>
                <option value="眼影">眼影</option>
                <option value="底妝">底妝</option>
                <option value="眉彩">眉彩</option>
                <option value="其他">其他</option>
              </select>

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
                        form.manufacture_date ? "has-value" : ""
                      }`}
                    >
                      {form.manufacture_date || "請輸入日期"}
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
                      form.expire_date ? "has-value" : ""
                    }`}
                  >
                    {form.expire_date || "請輸入日期"}
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
            OCR 商品資訊掃描視窗
        ========================= */}

        {showOcr && (
          <div className="ocr-overlay">
            <div className="ocr-modal">

              <div className="ocr-header">
                <h2>AI 掃描產品資訊</h2>

                <button
                  type="button"
                  className="ocr-close"
                  onClick={closeOcr}
                  disabled={analyzingProduct}
                >
                  ✕
                </button>
              </div>

              <p className="ocr-description">
                拍攝產品正面及背面標籤，自動辨識品牌、
                名稱、分類、色號與效期資訊。
              </p>

              {/* 正面與背面照片 */}
              <div className="ocr-image-group">

                {/* 商品正面 */}
                <div className="ocr-image-item">
                  <input
                    id="ocr-front-image"
                    type="file"
                    accept="image/*"
                    onChange={(e) =>
                      handleOcrImage(e, "front")
                    }
                    disabled={analyzingProduct}
                    hidden
                  />

                  <label
                    htmlFor="ocr-front-image"
                    className="ocr-upload-box"
                  >
                    {ocrFrontImage ? (
                      <>
                        <img
                          src={ocrFrontPreview}
                          alt="商品正面預覽"
                          className="ocr-preview"
                        />
                        <span className="ocr-upload-overlay">
                          更換照片
                        </span>
                      </>
                    ) : (
                      <>
                        <svg
                          width="30"
                          height="30"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="1.7"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        >
                          <rect
                            x="3"
                            y="3"
                            width="18"
                            height="18"
                            rx="3"
                          />
                          <circle cx="8.5" cy="8.5" r="1.5" />
                          <path d="m3 16 5-5 4 4 3-3 6 6" />
                        </svg>

                        <strong>商品正面</strong>
                        <span>點擊上傳</span>
                      </>
                    )}
                  </label>

                  {ocrFrontImage && (
                    <button
                      type="button"
                      className="ocr-remove-image"
                      onClick={() => setOcrFrontImage(null)}
                      disabled={analyzingProduct}
                    >
                      ✕
                    </button>
                  )}
                </div>

                {/* 商品背面 */}
                <div className="ocr-image-item">
                  <input
                    id="ocr-label-image"
                    type="file"
                    accept="image/*"
                    onChange={(e) =>
                      handleOcrImage(e, "label")
                    }
                    disabled={analyzingProduct}
                    hidden
                  />

                  <label
                    htmlFor="ocr-label-image"
                    className="ocr-upload-box"
                  >
                    {ocrLabelImage ? (
                      <>
                        <img
                          src={ocrLabelPreview}
                          alt="商品背面預覽"
                          className="ocr-preview"
                        />
                        <span className="ocr-upload-overlay">
                          更換照片
                        </span>
                      </>
                    ) : (
                      <>
                        <svg
                          width="30"
                          height="30"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="1.7"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        >
                          <rect
                            x="3"
                            y="3"
                            width="18"
                            height="18"
                            rx="3"
                          />
                          <circle cx="8.5" cy="8.5" r="1.5" />
                          <path d="m3 16 5-5 4 4 3-3 6 6" />
                        </svg>

                        <strong>背面／標籤</strong>
                        <span>點擊上傳</span>
                      </>
                    )}
                  </label>

                  {ocrLabelImage && (
                    <button
                      type="button"
                      className="ocr-remove-image"
                      onClick={() => setOcrLabelImage(null)}
                      disabled={analyzingProduct}
                    >
                      ✕
                    </button>
                  )}
                </div>

              </div>

              <p className="ocr-upload-hint">
                至少上傳一張照片即可進行辨識
              </p>

              {ocrError && (
                <p className="ocr-error">
                  {ocrError}
                </p>
              )}

              {analyzingProduct && (
                <div className="ocr-loading">
                  <div className="loading-circle"></div>
                  <p>AI 正在辨識產品資訊，請稍候...</p>
                </div>
              )}

              {/* 操作按鈕 */}
              <div className="ocr-actions">
                <button
                  type="button"
                  className="ocr-cancel"
                  onClick={closeOcr}
                  disabled={analyzingProduct}
                >
                  取消
                </button>

                <button
                  type="button"
                  className="ocr-confirm"
                  onClick={analyzeProductInfo}
                  disabled={
                    analyzingProduct ||
                    (!ocrFrontImage && !ocrLabelImage)
                  }
                >
                  <svg
                    width="20"
                    height="20"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.8"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d="M8 3H5a2 2 0 0 0-2 2v3" />
                    <path d="M16 3h3a2 2 0 0 1 2 2v3" />
                    <path d="M21 16v3a2 2 0 0 1-2 2h-3" />
                    <path d="M8 21H5a2 2 0 0 1-2-2v-3" />
                    <circle cx="12" cy="12" r="4" />
                  </svg>

                  {analyzingProduct
                    ? "辨識中..."
                    : "開始辨識"}
                </button>
              </div>

            </div>
          </div>
        )}

        
        {/* =========================
            照片剪裁視窗
        ========================= */}

        {showCrop && cropImage && (
          <div className="crop-overlay">

            <div className="crop-modal">

              <h2>
                {cropMode === "color"
                  ? "剪裁要辨識的顏色"
                  : "剪裁產品照片"}
              </h2>

              {cropMode === "color" && (
                <p className="crop-color-hint">
                  請移動或放大照片，讓範圍盡量填滿顏色，避免背景影響辨識結果
                </p>
              )}

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
                  onClick={cancelCrop}
                >
                  取消
                </button>

                <button
                  type="button"
                  className="crop-confirm"
                  onClick={confirmCrop}
                >
                  {cropMode === "color"
                    ? "確認並辨識顏色"
                    : "確認剪裁"}
                </button>

              </div>

            </div>

          </div>
        )}


      </div>

    </div>
  );
}

export default Cosmetics;