function toggleMenu() {
    const sidebar = document.getElementById("sidebar");
    const overlay = document.querySelector(".overlay");
    const btn = document.querySelector(".menu-btn");

    sidebar.classList.toggle("show");
    overlay.classList.toggle("show");

    // 👉 隱藏 / 顯示漢堡按鈕
    if (sidebar.classList.contains("show")) {
        btn.style.display = "none";
    } else {
        btn.style.display = "block";
    }
}