/* ===========================================================
   inscricao.js
   Fluxo: formulário -> mostra o QR code PIX fixo certo (unitário
   ou passe) -> participante sobe o comprovante -> grava inscrição
   "pendente" no Firestore + comprovante no Storage -> admin aprova
   manualmente no painel.
   =========================================================== */

const inpJogo = document.getElementById("inpJogo");
CATALOGO_JOGOS.forEach(j => {
  const opt = document.createElement("option");
  opt.value = j.id;
  opt.textContent = j.nome;
  inpJogo.appendChild(opt);
});

const params = new URLSearchParams(location.search);
if (params.get("tipo") === "passe") {
  document.querySelector('input[name="tipoInscricao"][value="passe"]').checked = true;
}

const radios = document.querySelectorAll('input[name="tipoInscricao"]');
function atualizarCardsRadio() {
  document.getElementById("cardUnico").classList.toggle("checked", document.querySelector('input[value="unico"]').checked);
  document.getElementById("cardPasse").classList.toggle("checked", document.querySelector('input[value="passe"]').checked);
}
radios.forEach(r => r.addEventListener("change", atualizarCardsRadio));
atualizarCardsRadio();

const form = document.getElementById("formInscricao");
const blocoPagamento = document.getElementById("blocoPagamento");
const blocoEnviado = document.getElementById("blocoEnviado");
const erroBox = document.getElementById("inscricaoErro");

let dadosInscricao = null;

form.addEventListener("submit", (e) => {
  e.preventDefault();
  erroBox.classList.add("hidden");

  const tipoInscricao = document.querySelector('input[name="tipoInscricao"]:checked').value;
  const valor = tipoInscricao === "passe" ? VALOR_PASSE_TJE : VALOR_JOGO_UNITARIO;

  dadosInscricao = {
    nomeCompleto: document.getElementById("inpNome").value.trim(),
    turmaId: document.getElementById("turmaSelect").value,
    turmaNome: document.getElementById("turmaSelect").selectedOptions[0]?.textContent || "",
    jogoId: inpJogo.value,
    jogoNome: inpJogo.selectedOptions[0]?.textContent || "",
    tipoInscricao,
    possuiPasse: tipoInscricao === "passe",
    email: document.getElementById("inpEmail").value.trim(),
    telefoneCapitao: document.getElementById("inpTelefone").value.trim(),
    valor
  };

  if (!dadosInscricao.turmaId) {
    mostrarErro("Selecione sua turma.");
    return;
  }

  // Mostra o QR code fixo certo pro tipo de inscrição escolhido
  document.getElementById("pixValor").textContent = formatarMoeda(valor);
  document.getElementById("pixQr").src = tipoInscricao === "passe"
    ? "img/qrcode-passe.png"
    : "img/qrcode-unitario.png";

  form.classList.add("hidden");
  blocoPagamento.classList.remove("hidden");
});

document.getElementById("formComprovante").addEventListener("submit", async (e) => {
  e.preventDefault();
  erroBox.classList.add("hidden");

  const arquivo = document.getElementById("inpComprovante").files[0];
  if (!arquivo) {
    mostrarErro("Selecione o comprovante do pagamento.");
    return;
  }

  const btn = document.getElementById("btnEnviarComprovante");
  btn.disabled = true;
  btn.innerHTML = '<div class="spinner"></div> Enviando...';

  try {
    // 1. cria a inscrição "pendente"
    const ref = await db.collection(COL_INSCRICOES).add({
      ...dadosInscricao,
      statusPagamento: "pendente",
      criadoEm: firebase.firestore.FieldValue.serverTimestamp()
    });

    // 2. sobe o comprovante pro Storage, associado ao id da inscrição
    const extensao = arquivo.name.split(".").pop();
    const caminho = `${PASTA_COMPROVANTES}/${ref.id}.${extensao}`;
    await storage.ref(caminho).put(arquivo);

    // 3. grava o caminho do comprovante na inscrição
    await ref.update({ comprovantePath: caminho });

    blocoPagamento.classList.add("hidden");
    blocoEnviado.classList.remove("hidden");
  } catch (err) {
    console.error(err);
    mostrarErro("Não foi possível enviar o comprovante. Tente novamente.");
    btn.disabled = false;
    btn.innerHTML = 'Enviar comprovante <i class="fa-solid fa-arrow-right"></i>';
  }
});

function mostrarErro(msg) {
  erroBox.textContent = msg;
  erroBox.classList.remove("hidden");
}

document.addEventListener("click", (e) => {
  if (e.target.closest("#btnCopiarPix")) {
    const input = document.getElementById("pixCopiaCola");
    input.select();
    navigator.clipboard.writeText(input.value);
    const btn = document.getElementById("btnCopiarPix");
    btn.innerHTML = '<i class="fa-solid fa-check"></i>';
    setTimeout(() => (btn.innerHTML = '<i class="fa-regular fa-copy"></i>'), 1500);
  }
});
