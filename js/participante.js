const telaLogin = document.getElementById("telaLogin");
const telaPainel = document.getElementById("telaPainel");
const btnSair = document.getElementById("btnSair");

document.getElementById("formLogin").addEventListener("submit", async (e) => {
  e.preventDefault();
  const erroBox = document.getElementById("loginErro");
  erroBox.classList.add("hidden");

  const id = document.getElementById("loginId").value.trim().toUpperCase();
  const senha = document.getElementById("loginSenha").value;
  const emailSintetico = `${id.toLowerCase()}@${DOMINIO_LOGIN}`;

  const btn = document.getElementById("btnLogin");
  btn.disabled = true;
  btn.innerHTML = '<div class="spinner"></div> Entrando...';

  try {
    await auth.signInWithEmailAndPassword(emailSintetico, senha);
  } catch (err) {
    erroBox.textContent = "ID ou senha inválidos.";
    erroBox.classList.remove("hidden");
    btn.disabled = false;
    btn.innerHTML = "Entrar";
  }
});

btnSair.addEventListener("click", () => auth.signOut());

auth.onAuthStateChanged(async (user) => {
  if (!user) {
    telaLogin.classList.remove("hidden");
    telaPainel.classList.add("hidden");
    btnSair.classList.add("hidden");
    return;
  }

  try {
    const snap = await db.collection(COL_INSCRICOES).where("authUid", "==", user.uid).limit(1).get();
    if (snap.empty) throw new Error("Inscrição não encontrada.");
    const doc = snap.docs[0];
    const d = doc.data();
    window._inscricaoIdAtual = doc.id;
    renderizarPainel(d.idParticipante || doc.id, d);
    telaLogin.classList.add("hidden");
    telaPainel.classList.remove("hidden");
    btnSair.classList.remove("hidden");
  } catch (err) {
    console.error(err);
    auth.signOut();
  }
});

function renderizarPainel(id, d) {
  document.getElementById("btnLogin").disabled = false;
  document.getElementById("btnLogin").innerHTML = "Entrar";

  const primeiroNome = (d.nomeCompleto || "").split(" ")[0] || "participante";
  document.getElementById("saudacaoNome").textContent = primeiroNome;
  document.getElementById("painelNome").textContent = d.nomeCompleto || "—";
  document.getElementById("painelTurma").textContent = d.turmaNome || "—";
  document.getElementById("avatarIniciais").textContent = iniciais(d.nomeCompleto);

  const statusPill = document.getElementById("painelStatus");
  statusPill.textContent = rotuloStatus(d.statusPagamento);
  statusPill.className = "status-pill " + (d.statusPagamento || "pendente");

  document.getElementById("infoId").textContent = id;
  document.getElementById("infoTurma").textContent = d.turmaNome || "—";
  document.getElementById("infoPasse").textContent = d.possuiPasse ? "Sim — todos os jogos" : "Não";
  document.getElementById("infoStatus").textContent = rotuloStatus(d.statusPagamento);

  const listaJogos = document.getElementById("listaJogosInscritos");
  listaJogos.innerHTML = "";
  const jogosDoParticipante = d.possuiPasse ? CATALOGO_JOGOS.map(j => j.id) : [d.jogoId];
  jogosDoParticipante.forEach(jid => {
    const info = CATALOGO_JOGOS.find(j => j.id === jid);
    if (!info) return;
    listaJogos.insertAdjacentHTML("beforeend", `
      <div class="game-card" style="padding:14px 18px; flex:0 0 auto;">
        <i class="fa-solid ${info.icone}" style="color:var(--blue-600); margin-bottom:6px; display:block; font-size:18px;"></i>
        <strong style="font-size:13.5px;">${info.nome}</strong>
      </div>
    `);
  });

  renderizarCronograma(d.cronograma || []);
  window._participanteAtual = { id, ...d };
}

function iniciais(nome) {
  if (!nome) return "--";
  const partes = nome.trim().split(" ");
  return (partes[0][0] + (partes[1]?.[0] || "")).toUpperCase();
}

function rotuloStatus(status) {
  return { aprovado: "Pagamento aprovado", pendente: "Pagamento pendente", recusado: "Pagamento recusado" }[status] || "—";
}

function renderizarCronograma(cronograma) {
  const el = document.getElementById("listaCronograma");
  if (!cronograma.length) {
    el.innerHTML = `<div class="empty-state"><i class="fa-solid fa-calendar-days"></i><p>Seu cronograma será divulgado assim que as chaves forem definidas.</p></div>`;
    return;
  }
  el.innerHTML = cronograma
    .slice()
    .sort((a, b) => new Date(a.data) - new Date(b.data))
    .map(item => {
      const dt = new Date(item.data + (item.horario ? "T" + item.horario : "T00:00"));
      const dia = dt.toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit" });
      return `
        <div class="schedule-item">
          <div class="sched-date">${dia}</div>
          <div class="sched-info">
            <strong>${item.jogo || ""} ${item.horario ? "· " + item.horario : ""}</strong>
            <span>${item.adversario ? "Contra " + item.adversario + " · " : ""}${item.local || "Local a definir"}</span>
          </div>
        </div>`;
    })
    .join("");
}

const modalSenha = document.getElementById("modalSenha");
document.getElementById("btnAlterarSenha").addEventListener("click", () => modalSenha.classList.remove("hidden"));
document.getElementById("btnFecharModalSenha").addEventListener("click", () => modalSenha.classList.add("hidden"));

document.getElementById("formAlterarSenha").addEventListener("submit", async (e) => {
  e.preventDefault();
  const erroBox = document.getElementById("senhaErro");
  erroBox.classList.add("hidden");

  const senhaAtual = document.getElementById("senhaAtual").value;
  const senhaNova = document.getElementById("senhaNova").value;

  if (senhaNova.length < 6) {
    erroBox.textContent = "A nova senha precisa ter pelo menos 6 caracteres.";
    erroBox.classList.remove("hidden");
    return;
  }

  try {
    const user = auth.currentUser;
    const credencial = firebase.auth.EmailAuthProvider.credential(user.email, senhaAtual);
    await user.reauthenticateWithCredential(credencial);
    await user.updatePassword(senhaNova);

    modalSenha.classList.add("hidden");
    e.target.reset();
    alert("Senha alterada com sucesso!");
  } catch (err) {
    erroBox.textContent = err.message;
    erroBox.classList.remove("hidden");
  }
});

document.getElementById("btnBaixarPdf").addEventListener("click", () => {
  const p = window._participanteAtual;
  if (!p) return;

  const { jsPDF } = window.jspdf;
  const doc = new jsPDF();

  doc.setFillColor(11, 27, 54);
  doc.rect(0, 0, 210, 32, "F");
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(18);
  doc.text("TJE 2026 — Comprovante de Inscrição", 14, 20);

  doc.setTextColor(20, 20, 20);
  doc.setFontSize(11);
  let y = 46;
  const linha = (label, valor) => {
    doc.setFont(undefined, "bold");
    doc.text(`${label}:`, 14, y);
    doc.setFont(undefined, "normal");
    doc.text(String(valor ?? "—"), 70, y);
    y += 9;
  };

  linha("ID do participante", p.id);
  linha("Nome completo", p.nomeCompleto);
  linha("Turma", p.turmaNome);
  linha("Tipo de inscrição", p.possuiPasse ? "Passe TJE (todos os jogos)" : "Jogo unitário — " + (p.jogoNome || ""));
  linha("Valor pago", formatarMoeda(p.valor || 0));
  linha("Status do pagamento", rotuloStatus(p.statusPagamento));
  linha("E-mail", p.email);
  linha("Telefone pessoal", p.telefoneCapitao);

  doc.setDrawColor(220, 220, 220);
  doc.line(14, y + 2, 196, y + 2);
  doc.setFontSize(9);
  doc.setTextColor(120, 120, 120);
  doc.text("Colégio Estadual Malba Tahan — Torneio de Jogos Escolares 2026", 14, y + 12);
  doc.text("Documento gerado eletronicamente pela Área do Participante.", 14, y + 18);

  doc.save(`comprovante-${p.id}.pdf`);
});
