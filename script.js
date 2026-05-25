function toggleMenu() {
    const sidebar = document.getElementById("sidebar");
    const overlay = document.querySelector(".overlay");

    sidebar.classList.toggle("show");
    overlay.classList.toggle("show");
}