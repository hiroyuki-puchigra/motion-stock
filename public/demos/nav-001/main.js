// ?bg=dark で背景を黒に切り替える
if (new URLSearchParams(location.search).get("bg") === "dark") document.body.classList.add("is-dark");

// メニューの開閉（aria属性も同期する）
const toggle = document.querySelector(".nav__toggle");
const menu = document.getElementById("menu");
toggle.addEventListener("click", () => {
  const open = document.body.classList.toggle("is-open");
  toggle.setAttribute("aria-expanded", String(open));
  toggle.setAttribute("aria-label", open ? "メニューを閉じる" : "メニューを開く");
  menu.setAttribute("aria-hidden", String(!open));
});
