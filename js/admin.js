const telaLoginAdmin = document.getElementById("telaLoginAdmin");
const telaAdmin = document.getElementById("telaAdmin");
const btnSairAdmin = document.getElementById("btnSairAdmin");

let inscricoesCache = [];
let turmasCache = [];

document.getElementById("formLoginAdmin").addEventListener("submit", async (e) => {
  e.preventDefault();
  const erroBox = document.getElementById("adminLoginErro");
  erroBox.classList.add("hidden");
  const btn = document.getElementById("btnAdminLogin");
  btn.disabled = true;
  btn.innerHTML = '<div class="spinner"></div> Entrando...';

  try {
    await auth.signInWithEmailAndPassword(
      document.getElementById("adminEmail").value.trim(),
      document.getElementById("adminSenha").value
    );
  } catch (err) {
    erroBox.textContent = "E-mail ou senha inválidos.";
    erroBox.classList.remove("hidden");
    btn.disabled = false;
    btn.innerHTML = "Entrar";
  }
});

btnSairAdmin.addEventListener("click", () => auth.signOut());

auth.onAuthStateChanged(async (user) => {
  document.getElementById("btnAdminLogin").disabled = false;
  document.getElementById("btnAdminLogin").innerHTML = "Entrar";

  if (!user) {
    telaLoginAdmin.classList.remove("hidden");
    telaAdmin.classList.add("hidden");
    btnSairAdmin.classList.add("hidden");
    return;
  }

  const adminDoc = await db.collection(COL_ADMINS).doc(user.uid).get();
  if (!adminDoc.exists) {
    document.getElementById("adminLoginErro").textContent = "Esta conta não tem permissão de administrador.";
    document.getElementById("adminLoginErro").classList.remove("hidden");
    auth.signOut();
    return;
  }

  telaLoginAdmin.classList.add("hidden");
  telaAdmin.classList.remove("hidden");
  btnSairAdmin.classList.remove("hidden");
  iniciarPainel();
});

document.querySelectorAll(".admin-tab").forEach(tab => {
  tab.addEventListener("click", () => {
    document.querySelectorAll(".admin-tab").forEach(t => t.classList.remove("active"));
    document.querySelectorAll(".admin-panel").forEach(p => p.classList.add("hidden"));
    tab.classList.add("active");
    document.getElementById("painel" + capitalize(tab.dataset.tab)).classList.remove("hidden");
  });
});
function capitalize(s) { return s.charAt(0).toUpperCase() + s.slice(1); }

let painelIniciado = false;
function iniciarPainel() {
  if (painelIniciado) return;
  painelIniciado = true;
  escutarInscricoes();
  escutarTurmas();
  montarFormsPremiacao();
  preencherSelectsEdicao();
  carregarConfiguracoes();
}

function escutarInscricoes() {
  db.collection(COL_INSCRICOES).orderBy("criadoEm", "desc").onSnapshot(snap => {
    inscricoesCache = snap.docs.map(d => ({ id: d.id, ...d.data() }));
    renderizarTabelaInscritos();
    renderizarEstatisticas();
    renderizarTabelaTurmas();
  });
}

function renderizarEstatisticas() {
  const total = inscricoesCache.length;
  const aprovados = inscricoesCache.filter(i => i.statusPagamento === "aprovado");
  const pendentes = inscricoesCache.filter(i => i.statusPagamento === "pendente").length;
  const receita = aprovados.reduce((s, i) => s + (i.valor || 0), 0);

  document.getElementById("statTotal").textContent = total;
  document.getElementById("statAprovados").textContent = aprovados.length;
  document.getElementById("statPendentes").textContent = pendentes;
  document.getElementById("statReceita").textContent = formatarMoeda(receita);
}

function renderizarTabelaInscritos() {
  const busca = document.getElementById("filtroBusca").value.toLowerCase();
  const statusFiltro = document.getElementById("filtroStatus").value;
  const tbody = document.getElementById("tabelaInscritos");

  const filtrados = inscricoesCache.filter(i => {
    const bateBusca = !busca ||
      (i.nomeCompleto || "").toLowerCase().includes(busca) ||
      (i.id || "").toLowerCase().includes(busca) ||
      (i.email || "").toLowerCase().includes(busca);
    const bateStatus = !statusFiltro || i.statusPagamento === statusFiltro;
    return bateBusca && bateStatus;
  });

  if (!filtrados.length) {
    tbody.innerHTML = `<tr><td colspan="10"><div class="empty-state"><i class="fa-solid fa-inbox"></i><p>Nenhum inscrito encontrado.</p></div></td></tr>`;
    return;
  }

  tbody.innerHTML = filtrados.map(i => `
    <tr>
      <td>${i.idParticipante || "<span style='color:var(--text-muted)'>—</span>"}</td>
      <td>${i.nomeCompleto || "—"}</td>
      <td>${i.turmaNome || "—"}</td>
      <td>${i.possuiPasse ? "Passe TJE" : (i.jogoNome || "—")}</td>
      <td>${i.possuiPasse ? "Passe" : "Unitário"}</td>
      <td>${i.formaPagamento === "dinheiro" ? "Dinheiro" : "Pix"}</td>
      <td><span class="status-pill ${i.statusPagamento}">${rotuloStatusAdmin(i.statusPagamento)}</span></td>
      <td>${formatarMoeda(i.valor || 0)}</td>
      <td>${i.comprovanteBase64 ? `<button class="btn btn-ghost btn-sm" data-acao="comprovante" data-id="${i.id}" title="Ver comprovante"><i class="fa-solid fa-receipt"></i></button>` : "—"}</td>
      <td>
        <div class="table-actions">
          ${i.statusPagamento !== "aprovado" ? `<button class="btn btn-ghost btn-sm" data-acao="confirmar" data-id="${i.id}" title="Confirmar pagamento"><i class="fa-solid fa-check"></i></button>` : ""}
          ${i.statusPagamento === "aprovado" && i.senhaProvisoria ? `<button class="btn btn-ghost btn-sm" data-acao="vercredenciais" data-id="${i.id}" title="Ver credenciais"><i class="fa-solid fa-id-card"></i></button>` : ""}
          ${i.statusPagamento === "aprovado" && i.senhaProvisoria && i.email ? `<button class="btn btn-ghost btn-sm" data-acao="reenviaremail" data-id="${i.id}" title="Reenviar e-mail com credenciais"><i class="fa-solid fa-paper-plane"></i></button>` : ""}
          <button class="btn btn-ghost btn-sm" data-acao="editar" data-id="${i.id}" title="Editar"><i class="fa-solid fa-pen"></i></button>
          <button class="btn btn-danger btn-sm" data-acao="cancelar" data-id="${i.id}" title="Cancelar inscrição"><i class="fa-solid fa-trash"></i></button>
        </div>
      </td>
    </tr>
  `).join("");
}

function gerarSenhaAleatoria() {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let senha = "";
  for (let i = 0; i < 6; i++) senha += chars[Math.floor(Math.random() * chars.length)];
  return senha;
}

async function proximoIdParticipante() {
  const ref = db.collection(COL_CONTADORES).doc("participantes");
  const novoNumero = await db.runTransaction(async (t) => {
    const doc = await t.get(ref);
    const atual = doc.exists ? (doc.data().seq || 0) : 0;
    const novo = atual + 1;
    t.set(ref, { seq: novo }, { merge: true });
    return novo;
  });
  return `TJE2026-${String(novoNumero).padStart(4, "0")}`;
}

async function aprovarInscricaoClient(inscricaoId) {
  const ref = db.collection(COL_INSCRICOES).doc(inscricaoId);
  const doc = await ref.get();
  if (!doc.exists) throw new Error("Inscrição não encontrada.");
  const inscricao = doc.data();
  if (inscricao.statusPagamento === "aprovado") return null;

  const idParticipante = await proximoIdParticipante();
  const senha = gerarSenhaAleatoria();
  const emailSintetico = `${idParticipante.toLowerCase()}@${DOMINIO_LOGIN}`;

  const cred = await authAuxiliar.createUserWithEmailAndPassword(emailSintetico, senha);
  const authUid = cred.user.uid;
  await authAuxiliar.signOut();

  await ref.update({
    statusPagamento: "aprovado",
    idParticipante,
    senhaProvisoria: senha,
    authUid,
    aprovadoEm: new Date().toISOString()
  });

  return {
    idParticipante,
    senha,
    email: inscricao.email,
    nome: inscricao.nomeCompleto
  };
}

function rotuloStatusAdmin(s) {
  return { aprovado: "Aprovado", pendente: "Pendente", recusado: "Recusado" }[s] || "—";
}

document.getElementById("filtroBusca").addEventListener("input", renderizarTabelaInscritos);
document.getElementById("filtroStatus").addEventListener("change", renderizarTabelaInscritos);

document.getElementById("tabelaInscritos").addEventListener("click", async (e) => {
  const btn = e.target.closest("button[data-acao]");
  if (!btn) return;
  const id = btn.dataset.id;
  const item = inscricoesCache.find(i => i.id === id);

  if (btn.dataset.acao === "confirmar") {
    if (!confirm("Confirmar manualmente o pagamento deste participante? Isso cria o login dele e envia as credenciais por e-mail.")) return;
    btn.disabled = true;
    try {
      const dados = await aprovarInscricaoClient(id);
      if (dados && dados.email) {
        try {
          await enviarEmailCredenciais(dados.email, dados.nome, dados.idParticipante, dados.senha);
          alert("Participante aprovado! E-mail com as credenciais enviado para " + dados.email + ".");
        } catch (errEmail) {
          console.error(errEmail);
          alert("Participante aprovado, mas o e-mail não pôde ser enviado. Use o botão de credenciais pra repassar manualmente.");
        }
      }
    } catch (err) {
      console.error(err);
      alert("Não foi possível aprovar: " + err.message);
    }
    btn.disabled = false;
  }

  if (btn.dataset.acao === "vercredenciais") {
    alert(`ID: ${item.idParticipante}\nSenha: ${item.senhaProvisoria}\n\nEnvie essas credenciais pro participante (WhatsApp/e-mail). Depois que ele trocar a senha, elas deixam de valer.`);
  }

  if (btn.dataset.acao === "reenviaremail") {
    btn.disabled = true;
    try {
      await enviarEmailCredenciais(item.email, item.nomeCompleto, item.idParticipante, item.senhaProvisoria);
      alert("E-mail reenviado para " + item.email + ".");
    } catch (err) {
      console.error(err);
      alert("Não foi possível enviar o e-mail. Confira a configuração do EmailJS.");
    }
    btn.disabled = false;
  }

  if (btn.dataset.acao === "comprovante") {
    try {
      const resposta = await fetch(item.comprovanteBase64);
      const blob = await resposta.blob();
      const url = URL.createObjectURL(blob);
      window.open(url, "_blank");
    } catch (err) {
      console.error(err);
      alert("Não foi possível abrir o comprovante.");
    }
  }

  if (btn.dataset.acao === "cancelar") {
    if (!confirm("Cancelar (excluir) esta inscrição? Essa ação não pode ser desfeita.")) return;
    await db.collection(COL_INSCRICOES).doc(id).delete();
  }

  if (btn.dataset.acao === "editar") abrirModalEdicao(item);
});

const modalEditar = document.getElementById("modalEditar");
function preencherSelectsEdicao() {
  const selJogo = document.getElementById("editJogo");
  selJogo.innerHTML = CATALOGO_JOGOS.map(j => `<option value="${j.id}">${j.nome}</option>`).join("");
}
function abrirModalEdicao(item) {
  document.getElementById("editId").value = item.id;
  document.getElementById("editNome").value = item.nomeCompleto || "";
  document.getElementById("editTurma").innerHTML = turmasCache.map(t => `<option value="${t.id}" ${t.id === item.turmaId ? "selected" : ""}>${t.nome}</option>`).join("");
  document.getElementById("editJogo").value = item.jogoId || "";
  document.getElementById("editTipo").value = item.possuiPasse ? "passe" : "unico";
  document.getElementById("editStatus").value = item.statusPagamento || "pendente";
  document.getElementById("editEmail").value = item.email || "";
  document.getElementById("editTelefone").value = item.telefoneCapitao || "";
  modalEditar.classList.remove("hidden");
}
document.getElementById("btnFecharEditar").addEventListener("click", () => modalEditar.classList.add("hidden"));

document.getElementById("formEditarParticipante").addEventListener("submit", async (e) => {
  e.preventDefault();
  const id = document.getElementById("editId").value;
  const turmaId = document.getElementById("editTurma").value;
  const turma = turmasCache.find(t => t.id === turmaId);
  const jogoId = document.getElementById("editJogo").value;
  const jogo = CATALOGO_JOGOS.find(j => j.id === jogoId);
  const tipo = document.getElementById("editTipo").value;

  await db.collection(COL_INSCRICOES).doc(id).update({
    nomeCompleto: document.getElementById("editNome").value.trim(),
    turmaId, turmaNome: turma ? turma.nome : "",
    jogoId, jogoNome: jogo ? jogo.nome : "",
    possuiPasse: tipo === "passe",
    tipoInscricao: tipo,
    valor: tipo === "passe" ? VALOR_PASSE_TJE : VALOR_JOGO_UNITARIO,
    statusPagamento: document.getElementById("editStatus").value,
    email: document.getElementById("editEmail").value.trim(),
    telefoneCapitao: document.getElementById("editTelefone").value.trim()
  });
  modalEditar.classList.add("hidden");
});

document.getElementById("btnExportarExcel").addEventListener("click", () => {
  const linhas = inscricoesCache.map(i => ({
    ID: i.idParticipante || "",
    Nome: i.nomeCompleto || "",
    Turma: i.turmaNome || "",
    Jogo: i.possuiPasse ? "Todos (Passe TJE)" : (i.jogoNome || ""),
    Tipo: i.possuiPasse ? "Passe TJE" : "Jogo unitário",
    "Forma de pagamento": i.formaPagamento === "dinheiro" ? "Dinheiro" : "Pix",
    "Status pagamento": rotuloStatusAdmin(i.statusPagamento),
    "Valor (R$)": i.valor || 0,
    "E-mail": i.email || "",
    "Telefone pessoal": i.telefoneCapitao || ""
  }));
  const ws = XLSX.utils.json_to_sheet(linhas);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "Inscritos TJE 2026");
  XLSX.writeFile(wb, `tje2026-inscritos-${new Date().toISOString().slice(0, 10)}.xlsx`);
});

function escutarTurmas() {
  db.collection(COL_TURMAS).orderBy("nome").onSnapshot(snap => {
    turmasCache = snap.docs.map(d => ({ id: d.id, ...d.data() }));
    renderizarTabelaTurmas();
  });
}

function renderizarTabelaTurmas() {
  const tbody = document.getElementById("tabelaTurmas");
  if (!turmasCache.length) {
    tbody.innerHTML = `<tr><td colspan="4"><div class="empty-state"><i class="fa-solid fa-school"></i><p>Nenhuma turma cadastrada.</p></div></td></tr>`;
    return;
  }
  tbody.innerHTML = turmasCache.map(t => {
    const qtd = inscricoesCache.filter(i => i.turmaId === t.id).length;
    return `
      <tr>
        <td>${t.nome}</td>
        <td><span class="status-pill ${t.ativo ? "aprovado" : "recusado"}">${t.ativo ? "Ativa" : "Inativa"}</span></td>
        <td>${qtd} inscrito(s)</td>
        <td>
          <div class="table-actions">
            <button class="btn btn-ghost btn-sm" data-acao="toggle" data-id="${t.id}" data-ativo="${t.ativo}">${t.ativo ? "Desativar" : "Ativar"}</button>
            <button class="btn btn-ghost btn-sm" data-acao="renomear" data-id="${t.id}"><i class="fa-solid fa-pen"></i></button>
            <button class="btn btn-danger btn-sm" data-acao="remover" data-id="${t.id}"><i class="fa-solid fa-trash"></i></button>
          </div>
        </td>
      </tr>`;
  }).join("");
}

document.getElementById("formNovaTurma").addEventListener("submit", async (e) => {
  e.preventDefault();
  const input = document.getElementById("novaTurmaNome");
  const nome = input.value.trim();
  if (!nome) return;
  await db.collection(COL_TURMAS).add({ nome, ativo: true, criadoEm: firebase.firestore.FieldValue.serverTimestamp() });
  input.value = "";
});

document.getElementById("tabelaTurmas").addEventListener("click", async (e) => {
  const btn = e.target.closest("button[data-acao]");
  if (!btn) return;
  const id = btn.dataset.id;

  if (btn.dataset.acao === "toggle") {
    await db.collection(COL_TURMAS).doc(id).update({ ativo: !(btn.dataset.ativo === "true") });
  }
  if (btn.dataset.acao === "renomear") {
    const atual = turmasCache.find(t => t.id === id);
    const novoNome = prompt("Novo nome da turma:", atual?.nome || "");
    if (novoNome && novoNome.trim()) await db.collection(COL_TURMAS).doc(id).update({ nome: novoNome.trim() });
  }
  if (btn.dataset.acao === "remover") {
    if (!confirm("Remover esta turma? Ela deixará de aparecer no formulário de inscrição.")) return;
    await db.collection(COL_TURMAS).doc(id).delete();
  }
});

function montarFormsPremiacao() {
  const wrap = document.getElementById("formsPremiacao");
  wrap.innerHTML = CATALOGO_JOGOS.map(j => `
    <form class="form-card" data-jogo="${j.id}" style="margin:0;">
      <h3><i class="fa-solid ${j.icone}"></i> ${j.nome}</h3>
      <div class="field"><label>Equipe campeã</label><input type="text" name="campeao"></div>
      <div class="field"><label>Melhor jogador</label><input type="text" name="melhorJogador"></div>
      <div class="field"><label>Data da final</label><input type="date" name="dataFinal"></div>
      <div class="field" style="display:flex; align-items:center; gap:10px;">
        <input type="checkbox" name="resultadoOficial" id="oficial-${j.id}" style="width:auto;">
        <label for="oficial-${j.id}" style="margin:0;">Publicar como resultado oficial</label>
      </div>
      <button type="submit" class="btn btn-primary btn-block btn-sm">Salvar resultado</button>
    </form>
  `).join("");

  CATALOGO_JOGOS.forEach(j => {
    db.collection(COL_JOGOS).doc(j.id).get().then(doc => {
      if (!doc.exists) return;
      const d = doc.data();
      const form = wrap.querySelector(`form[data-jogo="${j.id}"]`);
      form.campeao.value = d.campeao || "";
      form.melhorJogador.value = d.melhorJogador || "";
      form.dataFinal.value = d.dataFinal || "";
      form.resultadoOficial.checked = !!d.resultadoOficial;
    });
  });

  wrap.addEventListener("submit", async (e) => {
    e.preventDefault();
    const form = e.target;
    const jogoId = form.dataset.jogo;
    await db.collection(COL_JOGOS).doc(jogoId).set({
      campeao: form.campeao.value.trim(),
      melhorJogador: form.melhorJogador.value.trim(),
      dataFinal: form.dataFinal.value,
      resultadoOficial: form.resultadoOficial.checked
    }, { merge: true });
    const btn = form.querySelector("button[type=submit]");
    const original = btn.textContent;
    btn.textContent = "Salvo!";
    setTimeout(() => (btn.textContent = original), 1500);
  });
}

// ---- Máscara da Chave Pix, de acordo com o tipo selecionado ----

function pixSomenteDigitos(v) {
  return (v || "").replace(/\D/g, "");
}

function pixMaskCpf(v) {
  return pixSomenteDigitos(v)
    .slice(0, 11)
    .replace(/(\d{3})(\d)/, "$1.$2")
    .replace(/(\d{3})(\d)/, "$1.$2")
    .replace(/(\d{3})(\d{1,2})$/, "$1-$2");
}

function pixMaskCnpj(v) {
  return pixSomenteDigitos(v)
    .slice(0, 14)
    .replace(/(\d{2})(\d)/, "$1.$2")
    .replace(/(\d{3})(\d)/, "$1.$2")
    .replace(/(\d{3})(\d)/, "$1/$2")
    .replace(/(\d{4})(\d{1,2})$/, "$1-$2");
}

function pixMaskTelefone(v) {
  const d = pixSomenteDigitos(v).slice(0, 11);
  if (d.length <= 10) {
    return d.replace(/(\d{2})(\d)/, "($1) $2").replace(/(\d{4})(\d{1,4})$/, "$1-$2");
  }
  return d.replace(/(\d{2})(\d)/, "($1) $2").replace(/(\d{5})(\d{1,4})$/, "$1-$2");
}

function pixPlaceholderPorTipo(tipo) {
  return {
    cpf: "000.000.000-00",
    cnpj: "00.000.000/0000-00",
    telefone: "(00) 00000-0000",
    email: "seuemail@exemplo.com",
    aleatoria: "chave aleatória (UUID)"
  }[tipo] || "";
}

// Converte o valor digitado (já mascarado) para o formato que o Pix exige de fato.
function pixNormalizarChave(tipo, valorDigitado) {
  const digits = pixSomenteDigitos(valorDigitado);
  switch (tipo) {
    case "cpf":
      return digits.slice(0, 11);
    case "cnpj":
      return digits.slice(0, 14);
    case "telefone": {
      let d = digits;
      if (d.length > 11 && d.startsWith("55")) d = d.slice(2);
      return "+55" + d.slice(0, 11);
    }
    case "email":
      return (valorDigitado || "").trim().toLowerCase();
    default:
      return (valorDigitado || "").trim();
  }
}

// Ao carregar uma chave já salva, remonta a versão mascarada para exibir no campo.
function pixParaExibicao(tipo, chaveSalva) {
  if (tipo === "telefone") {
    let d = pixSomenteDigitos(chaveSalva);
    if (d.startsWith("55")) d = d.slice(2);
    return pixMaskTelefone(d);
  }
  if (tipo === "cpf") return pixMaskCpf(chaveSalva);
  if (tipo === "cnpj") return pixMaskCnpj(chaveSalva);
  return chaveSalva || "";
}

function pixDetectarTipo(chave) {
  if (!chave) return "telefone";
  if (chave.includes("@")) return "email";
  if (chave.startsWith("+")) return "telefone";
  const d = pixSomenteDigitos(chave);
  if (d.length === 11) return "cpf";
  if (d.length === 14) return "cnpj";
  return "aleatoria";
}

(function configurarMascaraPixChave() {
  const selectTipo = document.getElementById("inputPixTipo");
  const inputChave = document.getElementById("inputPixChave");
  if (!selectTipo || !inputChave) return;

  const aplicarMascara = () => {
    const tipo = selectTipo.value;
    inputChave.placeholder = pixPlaceholderPorTipo(tipo);
    if (tipo === "cpf") inputChave.value = pixMaskCpf(inputChave.value);
    else if (tipo === "cnpj") inputChave.value = pixMaskCnpj(inputChave.value);
    else if (tipo === "telefone") inputChave.value = pixMaskTelefone(inputChave.value);
  };

  selectTipo.addEventListener("change", aplicarMascara);
  inputChave.addEventListener("input", aplicarMascara);
})();

async function carregarConfiguracoes() {
  const input = document.getElementById("inputDataEncerramento");
  if (!input) return;
  try {
    const doc = await db.collection("config").doc("site").get();
    if (doc.exists && doc.data().dataEncerramento) {
      const iso = doc.data().dataEncerramento;
      input.value = iso.slice(0, 16);
    }
    if (doc.exists && doc.data().pix) {
      const pix = doc.data().pix;
      const tipo = pix.tipo || pixDetectarTipo(pix.chave);
      const selectTipo = document.getElementById("inputPixTipo");
      selectTipo.value = tipo;
      document.getElementById("inputPixChave").placeholder = pixPlaceholderPorTipo(tipo);
      document.getElementById("inputPixChave").value = pixParaExibicao(tipo, pix.chave || "");
      document.getElementById("inputPixNome").value = pix.nomeRecebedor || "";
      document.getElementById("inputPixCidade").value = pix.cidade || "";
    }
  } catch (err) {
    console.error(err);
  }
}

document.getElementById("formConfiguracoes")?.addEventListener("submit", async (e) => {
  e.preventDefault();
  const input = document.getElementById("inputDataEncerramento");
  if (!input.value) return;
  const btn = e.target.querySelector("button[type=submit]");
  btn.disabled = true;
  try {
    await db.collection("config").doc("site").set({
      dataEncerramento: `${input.value}:00-03:00`
    }, { merge: true });
    const original = btn.textContent;
    btn.textContent = "Salvo!";
    setTimeout(() => (btn.textContent = original), 1500);
  } catch (err) {
    console.error(err);
    alert("Não foi possível salvar a configuração.");
  }
  btn.disabled = false;
});

document.getElementById("formConfigPix")?.addEventListener("submit", async (e) => {
  e.preventDefault();
  const tipo = document.getElementById("inputPixTipo").value;
  const chave = pixNormalizarChave(tipo, document.getElementById("inputPixChave").value);
  const nomeRecebedor = document.getElementById("inputPixNome").value.trim();
  const cidade = document.getElementById("inputPixCidade").value.trim();
  if (!chave || !nomeRecebedor || !cidade) return;

  const btn = e.target.querySelector("button[type=submit]");
  btn.disabled = true;
  try {
    await db.collection("config").doc("site").set({
      pix: { chave, tipo, nomeRecebedor, cidade }
    }, { merge: true });
    const original = btn.textContent;
    btn.textContent = "Salvo!";
    setTimeout(() => (btn.textContent = original), 1500);
  } catch (err) {
    console.error(err);
    alert("Não foi possível salvar a chave Pix.");
  }
  btn.disabled = false;
});
