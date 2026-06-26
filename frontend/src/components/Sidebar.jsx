import { Link } from "react-router-dom";

function Sidebar({
  active,
  menuOpen,
  toggleMenu,
}) {
  function handleClick() {
    if (menuOpen) {
      toggleMenu();
    }
  }

  return (
    <>
      {!menuOpen && (
        <button
          className="menu-btn"
          onClick={toggleMenu}
        >
          ☰
        </button>
      )}

      <div
        className={`overlay ${menuOpen ? "show" : ""}`}
        onClick={toggleMenu}
      />

      <div
        className={`sidebar ${menuOpen ? "show" : ""}`}
      >
        <button
          className="close-btn"
          type="button"
          onClick={toggleMenu}
        >
          ✕
        </button>

        <Link
          to="/"
          className="logo"
          onClick={handleClick}
        >
          你的美妝助理💅🏻
        </Link>

        <Link
          to="/cosmetics"
          className={active === "cosmetics" ? "active" : ""}
          onClick={handleClick}
        >
          💄 我的化妝品
        </Link>

        <Link
          to="/skincare"
          className={active === "skincare" ? "active" : ""}
          onClick={handleClick}
        >
          🧴 我的保養品
        </Link>

        <Link
          to="/palette"
          className={active === "palette" ? "active" : ""}
          onClick={handleClick}
        >
          🎨 我的色卡
        </Link>

        <Link
          to="/shopping"
          className={active === "shopping" ? "active" : ""}
          onClick={handleClick}
        >
          🛒 購物清單
        </Link>

        <Link
          to="/expiry"
          className={active === "expiry" ? "active" : ""}
          onClick={handleClick}
        >
          ⏰ 即將過期
        </Link>
      </div>
    </>
  );
}

export default Sidebar;