// ?bg=dark で背景を黒に切り替える
if (new URLSearchParams(location.search).get("bg") === "dark") document.body.classList.add("is-dark");

// 0→100 までカウントし、終わったら幕を上げて本文を表示する
const COUNT_MS = 1800; // style.css の --count-time と揃える
const countEl = document.getElementById("count");
const loader = document.querySelector(".loader");
const start = performance.now();

function tick(now) {
  const t = Math.min((now - start) / COUNT_MS, 1);
  countEl.textContent = Math.round(100 * (1 - Math.pow(1 - t, 3))); // 終盤ゆっくり
  if (t < 1) return requestAnimationFrame(tick);
  loader.classList.add("is-done");
  document.body.classList.add("is-ready");
}
requestAnimationFrame(tick);
