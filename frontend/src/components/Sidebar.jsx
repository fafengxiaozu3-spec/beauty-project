import { Link } from "react-router-dom";

function Sidebar({ active, menuOpen, toggleMenu }) {
  return (
    <>
      {/* ☰ 漢堡按鈕 */}
      {!menuOpen && (
        <button className="menu-btn" onClick={toggleMenu}>
          ☰
        </button>
      )}

      {/* overlay */}
      <div
        className={`overlay ${menuOpen ? "show" : ""}`}
        onClick={toggleMenu}
      ></div>

      {/* sidebar */}
      <div className={`sidebar ${menuOpen ? "show" : ""}`}>

        <button className="close-btn" onClick={toggleMenu}>
          ✕
        </button>

        <Link to="/" className="logo">
          你的美妝助理💅🏻
        </Link>

        <Link to="/cosmetics" className={active === "cosmetics" ? "active" : ""}>
          💄 我的化妝品
        </Link>

        <Link to="/skincare" className={active === "skincare" ? "active" : ""}>
          🧴 我的保養品
        </Link>

        <Link to="/palette" className={active === "palette" ? "active" : ""}>
          🎨 我的色卡
        </Link>

        <Link to="/shopping" className={active === "shopping" ? "active" : ""}>
          🛒 購物清單
        </Link>

        <Link to="/expiry" className={active === "expiry" ? "active" : ""}>
          ⏰ 即將過期
        </Link>

      </div>
    </>
  );
}

export default Sidebar;