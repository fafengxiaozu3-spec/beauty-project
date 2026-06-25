import Sidebar from "../components/Sidebar";

function Cosmetics() {
  return (
    <>
      <Sidebar active="cosmetics" />

      <div className="main">
        <h1>我的化妝品💄</h1>
        <p>內容</p>
      </div>
    </>
  );
}

export default Cosmetics;