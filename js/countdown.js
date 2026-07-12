const DATA_ENCERRAMENTO_PADRAO = new Date("2026-07-20T23:59:59-03:00");

async function iniciarCountdown() {
  const elDias = document.getElementById("cd-dias");
  const elHoras = document.getElementById("cd-horas");
  const elMin = document.getElementById("cd-min");
  const elSeg = document.getElementById("cd-seg");
  const wrapper = document.getElementById("countdownBox");
  const ctaVaga = document.getElementById("btnGarantirVaga");

  if (!elDias || !elHoras || !elMin || !elSeg) return;

  let dataEncerramento = DATA_ENCERRAMENTO_PADRAO;

  try {
    const snap = await db.collection("config").doc("site").get();
    if (snap.exists && snap.data().dataEncerramento) {
      dataEncerramento = new Date(snap.data().dataEncerramento);
    }
  } catch (err) {
    console.error(err);
  }

  function atualizar() {
    const agora = new Date();
    const diff = dataEncerramento - agora;

    if (diff <= 0) {
      elDias.textContent = "00";
      elHoras.textContent = "00";
      elMin.textContent = "00";
      elSeg.textContent = "00";
      if (wrapper) wrapper.classList.add("encerrado");
      if (ctaVaga) {
        ctaVaga.textContent = "Inscrições encerradas";
        ctaVaga.classList.add("btn-ghost");
        ctaVaga.classList.remove("btn-primary");
        ctaVaga.href = "#";
        ctaVaga.style.pointerEvents = "none";
      }
      clearInterval(timer);
      return;
    }

    const dias = Math.floor(diff / (1000 * 60 * 60 * 24));
    const horas = Math.floor((diff / (1000 * 60 * 60)) % 24);
    const min = Math.floor((diff / (1000 * 60)) % 60);
    const seg = Math.floor((diff / 1000) % 60);

    elDias.textContent = String(dias).padStart(2, "0");
    elHoras.textContent = String(horas).padStart(2, "0");
    elMin.textContent = String(min).padStart(2, "0");
    elSeg.textContent = String(seg).padStart(2, "0");
  }

  atualizar();
  const timer = setInterval(atualizar, 1000);
}

document.addEventListener("DOMContentLoaded", iniciarCountdown);
