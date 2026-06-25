import Sidebar from "../components/Sidebar";

function Skincare() {
  return (
    <>
      <Sidebar active="skincare" />

      <div className="main">
        <h1>我的保養品</h1>
        <p>內容</p>
      </div>
    </>
  );
}

export default Skincare;