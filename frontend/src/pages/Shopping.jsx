import Sidebar from "../components/Sidebar";

function Shopping() {
  return (
    <>
      <Sidebar active="shopping" />

      <div className="main">
        <h1>我的購物車💄</h1>
        <p>內容</p>
      </div>
    </>
  );
}

export default Shopping;