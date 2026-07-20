import { useState, useEffect } from "react";

function Header({ title, toggleMenu }) {
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

      <h1>{title}</h1>
    </div>
  );
}

export default Header;