const bg=new URLSearchParams(location.search).get("bg");if(bg==="dark")document.body.classList.add("is-dark");
const h=document.querySelector("[data-split]");
const text=h.textContent;h.textContent="";h.setAttribute("aria-label",text);
[...text].forEach((c,i)=>{const s=document.createElement("span");s.className="char";s.setAttribute("aria-hidden","true");s.style.setProperty("--i",i);s.textContent=c;h.append(s)});
