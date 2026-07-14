const navToggle = document.getElementById("navToggle");
const navLinks = document.getElementById("navLinks");
if (navToggle && navLinks) {
  navToggle.addEventListener("click", () => {
    navLinks.classList.toggle("open");
    const icon = navToggle.querySelector("i");
    if (icon) {
      icon.classList.toggle("fa-bars");
      icon.classList.toggle("fa-xmark");
    }
  });
  navLinks.querySelectorAll("a").forEach(a =>
    a.addEventListener("click", () => navLinks.classList.remove("open"))
  );
}

(function marcarLinkAtivo() {
  const pagina = location.pathname.split("/").pop() || "index.html";
  document.querySelectorAll(".nav-links a").forEach(a => {
    if (a.getAttribute("href") === pagina) a.classList.add("active");
  });
})();

document.querySelectorAll(".footer-year").forEach(el => {
  el.textContent = new Date().getFullYear();
});

function formatarMoeda(valor) {
  return valor.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

(function posicionarNuvensAleatoriamente() {
  const zonas = [ [4, 22], [22, 42], [42, 62], [62, 82] ]; // faixas verticais p/ espalhar bem
  document.querySelectorAll(".hero-game-bg .cloud").forEach((nuvem, i) => {
    const [min, max] = zonas[i % zonas.length];
    const top = min + Math.random() * (max - min);
    const duracao = 26 + Math.random() * 26; // 26s a 52s
    const atraso = -Math.random() * duracao; // ponto de entrada aleatório na animação
    nuvem.style.top = top.toFixed(1) + "%";
    nuvem.style.animationDuration = duracao.toFixed(1) + "s";
    nuvem.style.animationDelay = atraso.toFixed(1) + "s";
  });
})();
