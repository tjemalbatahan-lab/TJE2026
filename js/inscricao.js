(async function verificarInscricoesAbertas() {
  try {
    const snap = await db.collection("config").doc("site").get();
    const dataEncerramento = snap.exists ? snap.data().dataEncerramento : null;
    if (dataEncerramento && new Date(dataEncerramento) <= new Date()) {
      document.getElementById("formInscricao").classList.add("hidden");
      document.getElementById("blocoEncerrado").classList.remove("hidden");
    }
  } catch (err) {
    console.error(err);
  }
})();

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

const radiosForma = document.querySelectorAll('input[name="formaPagamento"]');
function atualizarCardsForma() {
  document.getElementById("cardFormaPix").classList.toggle("checked", document.querySelector('input[name="formaPagamento"][value="pix"]').checked);
  document.getElementById("cardFormaDinheiro").classList.toggle("checked", document.querySelector('input[name="formaPagamento"][value="dinheiro"]').checked);
}
radiosForma.forEach(r => r.addEventListener("change", atualizarCardsForma));
atualizarCardsForma();

const form = document.getElementById("formInscricao");
const blocoFormaPagamento = document.getElementById("blocoFormaPagamento");
const blocoPagamento = document.getElementById("blocoPagamento");
const blocoDinheiro = document.getElementById("blocoDinheiro");
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

  form.classList.add("hidden");
  blocoFormaPagamento.classList.remove("hidden");
});

document.getElementById("btnConfirmarFormaPagamento").addEventListener("click", async () => {
  const formaPagamento = document.querySelector('input[name="formaPagamento"]:checked').value;
  dadosInscricao.formaPagamento = formaPagamento;

  if (formaPagamento === "pix") {
    document.getElementById("pixValor").textContent = formatarMoeda(dadosInscricao.valor);
    document.getElementById("pixQr").src = dadosInscricao.tipoInscricao === "passe"
      ? "img/qrcode-passe.png"
      : "img/qrcode-unitario.png";

    blocoFormaPagamento.classList.add("hidden");
    blocoPagamento.classList.remove("hidden");
    return;
  }

  const btn = document.getElementById("btnConfirmarFormaPagamento");
  btn.disabled = true;
  btn.innerHTML = '<div class="spinner"></div> Enviando...';

  try {
    await db.collection(COL_INSCRICOES).add({
      ...dadosInscricao,
      statusPagamento: "pendente",
      criadoEm: firebase.firestore.FieldValue.serverTimestamp()
    });

    blocoFormaPagamento.classList.add("hidden");
    blocoDinheiro.classList.remove("hidden");
  } catch (err) {
    console.error(err);
    if (err.code === "permission-denied") {
      blocoFormaPagamento.classList.add("hidden");
      document.getElementById("blocoEncerrado").classList.remove("hidden");
    } else {
      mostrarErro("Não foi possível registrar a inscrição. Tente novamente.");
    }
    btn.disabled = false;
    btn.innerHTML = 'Continuar <i class="fa-solid fa-arrow-right"></i>';
  }
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
    const ref = await db.collection(COL_INSCRICOES).add({
      ...dadosInscricao,
      statusPagamento: "pendente",
      criadoEm: firebase.firestore.FieldValue.serverTimestamp()
    });

    const extensao = arquivo.name.split(".").pop();
    const caminho = `${PASTA_COMPROVANTES}/${ref.id}.${extensao}`;
    await storage.ref(caminho).put(arquivo);

    await ref.update({ comprovantePath: caminho });

    blocoPagamento.classList.add("hidden");
    blocoEnviado.classList.remove("hidden");
  } catch (err) {
    console.error(err);
    if (err.code === "permission-denied") {
      mostrarErro("As inscrições foram encerradas enquanto você preenchia o formulário.");
      blocoPagamento.classList.add("hidden");
      document.getElementById("blocoEncerrado").classList.remove("hidden");
    } else {
      mostrarErro("Não foi possível enviar o comprovante. Tente novamente.");
      btn.disabled = false;
      btn.innerHTML = 'Enviar comprovante <i class="fa-solid fa-arrow-right"></i>';
    }
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
