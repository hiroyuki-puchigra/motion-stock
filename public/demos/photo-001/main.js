const bg=new URLSearchParams(location.search).get("bg");if(bg==="dark")document.body.classList.add("is-dark");
const target=document.querySelector(".reveal");
new IntersectionObserver((es,io)=>es.forEach(e=>{if(e.isIntersecting){target.classList.add("is-in");io.disconnect()}}),{threshold:.35}).observe(target);
