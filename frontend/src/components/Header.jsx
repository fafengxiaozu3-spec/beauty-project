import { useState, useEffect } from "react";

function Header({
  title,
  toggleMenu,
  showSearch,
  setShowSearch,
  searchText,
  setSearchText
}) {
  const [showHeader, setShowHeader] = useState(true);

  useEffect(() => {
    let lastScroll = 0;

    function handleScroll() {
      const currentScroll = window.scrollY;

      if (currentScroll > lastScroll && currentScroll > 50) {
        // 往下滑
        setShowHeader(false);
      } else {
        // 往上滑
        setShowHeader(true);
      }

      lastScroll = currentScroll;
    }

    window.addEventListener("scroll", handleScroll);

    return () => {
      window.removeEventListener("scroll", handleScroll);
    };
  }, []);

  return (
    <div className={`page-header ${showHeader ? "" : "hide"}`}>

      <button
        className="menu-btn"
        onClick={toggleMenu}
      >
        ☰
      </button>

      {!showSearch ? (

        <>
          <h1>{title}</h1>

          <button
            className="search-btn"
            onClick={() => setShowSearch(true)}
          >
            🔍
          </button>
        </>

      ) : (

        <div className="search-bar">

          <input
            autoFocus
            type="text"
            placeholder="搜尋品牌、分類、產品..."
            value={searchText}
            onChange={(e) => setSearchText(e.target.value)}
          />

          <button
            className="close-search"
            onClick={() => {
              setSearchText("");
              setShowSearch(false);
            }}
          >
            ✕
          </button>

        </div>

      )}

    </div>
  );
}

export default Header;