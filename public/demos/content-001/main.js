// ?bg=dark で背景を黒に切り替える
if (new URLSearchParams(location.search).get("bg") === "dark") document.body.classList.add("is-dark");

// 画面に入ったカードを、順番にずらして表示する
const cards = [...document.querySelectorAll("[data-reveal]")];
cards.forEach((c, i) => c.style.setProperty("--i", i));
const io = new IntersectionObserver((entries) => {
  entries.forEach((e) => {
    if (!e.isIntersecting) return;
    e.target.classList.add("is-in");
    io.unobserve(e.target);
  });
}, { threshold: 0.3 });
cards.forEach((c) => io.observe(c));
