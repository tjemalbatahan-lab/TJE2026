/* ===========================================================
   main.js — comportamento comum a todas as páginas
   =========================================================== */

// Menu mobile
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

// Marca o link ativo no menu conforme a página atual
(function marcarLinkAtivo() {
  const pagina = location.pathname.split("/").pop() || "index.html";
  document.querySelectorAll(".nav-links a").forEach(a => {
    if (a.getAttribute("href") === pagina) a.classList.add("active");
  });
})();

// Ano no rodapé
document.querySelectorAll(".footer-year").forEach(el => {
  el.textContent = new Date().getFullYear();
});

// Utilitário simples de formatação de moeda
function formatarMoeda(valor) {
  return valor.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}
