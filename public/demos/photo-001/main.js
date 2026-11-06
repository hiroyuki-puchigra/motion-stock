// ?bg=dark で背景を黒に切り替える
if (new URLSearchParams(location.search).get("bg") === "dark") document.body.classList.add("is-dark");

// 写真が画面に入ったら、一度だけマスクを広げる
const target = document.querySelector(".reveal");
const observer = new IntersectionObserver((entries, io) => {
  entries.forEach((entry) => {
    if (!entry.isIntersecting) return;
    target.classList.add("is-in");
    io.disconnect();
  });
}, { threshold: 0.35 });
observer.observe(target);
