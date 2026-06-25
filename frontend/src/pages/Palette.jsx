import Sidebar from "../components/Sidebar";

function Palette() {
  return (
    <>
      <Sidebar active="palette" />

      <div className="main">
        <h1>我的色卡</h1>
        <p>內容</p>
      </div>
    </>
  );
}

export default Palette;