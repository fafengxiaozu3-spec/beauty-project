import Sidebar from "../components/Sidebar";

function Expiry() {
  return (
    <>
      <Sidebar active="expiry" />

      <div className="main">
        <h1>即將過期的商品⚠️</h1>
        <p>內容</p>
      </div>
    </>
  );
}

export default Expiry;