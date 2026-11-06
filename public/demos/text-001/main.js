// ?bg=dark で背景を黒に切り替える
if (new URLSearchParams(location.search).get("bg") === "dark") document.body.classList.add("is-dark");

// 見出しを1文字ずつに分割する（読み上げ用に元の文は aria-label に残す）
const heading = document.querySelector("[data-split]");
const text = heading.textContent;
heading.textContent = "";
heading.setAttribute("aria-label", text);

[...text].forEach((char, i) => {
  const span = document.createElement("span");
  span.className = "char";
  span.setAttribute("aria-hidden", "true");
  span.style.setProperty("--i", i);
  span.textContent = char;
  heading.append(span);
});
