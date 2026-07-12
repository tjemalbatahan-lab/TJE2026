const seletor = document.getElementById("seletorJogo");
const wrap = document.getElementById("champWrap");

CATALOGO_JOGOS.forEach(j => {
  const opt = document.createElement("option");
  opt.value = j.id;
  opt.textContent = j.nome;
  seletor.appendChild(opt);
});

function estadoVazio(msg) {
  wrap.innerHTML = `
    <div class="empty-state">
      <i class="fa-solid fa-hourglass-half"></i>
      <p>${msg}</p>
    </div>`;
}

async function carregarCampeao(jogoId) {
  wrap.innerHTML = `<div class="empty-state"><div class="spinner dark" style="margin:0 auto;"></div></div>`;
  try {
    const doc = await db.collection(COL_JOGOS).doc(jogoId).get();
    const jogoInfo = CATALOGO_JOGOS.find(j => j.id === jogoId);

    if (!doc.exists || !doc.data().resultadoOficial) {
      estadoVazio("O resultado oficial desta modalidade ainda não foi divulgado.");
      return;
    }

    const d = doc.data();
    const dataFinal = d.dataFinal ? formatarData(d.dataFinal) : "—";

    wrap.innerHTML = `
      <div class="champion-card">
        <div class="trophy"><i class="fa-solid fa-trophy"></i></div>
        <span class="kicker">${jogoInfo ? jogoInfo.nome : ""}</span>
        <div class="champ-team">${d.campeao || "—"}</div>
        <p style="margin:0;">Equipe campeã do TJE 2026</p>
        <div class="champ-meta">
          <div class="cm-item">
            <div class="cm-label">Melhor jogador</div>
            <div class="cm-value">${d.melhorJogador || "—"}</div>
          </div>
          <div class="cm-item">
            <div class="cm-label">Data da final</div>
            <div class="cm-value">${dataFinal}</div>
          </div>
        </div>
        <div class="official-tag"><i class="fa-solid fa-circle-check"></i> Resultado oficial</div>
      </div>
    `;
  } catch (e) {
    console.error(e);
    estadoVazio("Não foi possível carregar o resultado agora. Tente novamente em instantes.");
  }
}

function formatarData(valor) {
  let d;
  if (typeof valor === "string") d = new Date(valor + "T00:00:00");
  else if (valor.toDate) d = valor.toDate();
  else d = new Date(valor);
  return d.toLocaleDateString("pt-BR");
}

seletor.addEventListener("change", () => carregarCampeao(seletor.value));
estadoVazio("Selecione um jogo acima para ver o campeão.");
