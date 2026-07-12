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
    await comTimeout(auth.signInWithEmailAndPassword(emailSintetico, senha));
  } catch (err) {
    if (err.message === "TIMEOUT_CONEXAO") {
      erroBox.textContent = "A conexão travou. Recarregue a página e tente novamente.";
    } else {
      erroBox.textContent = "ID ou senha inválidos.";
    }
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

  const maxTentativas = 3;
  for (let tentativa = 1; tentativa <= maxTentativas; tentativa++) {
    try {
      const snap = await comTimeout(
        db.collection(COL_INSCRICOES).where("authUid", "==", user.uid).limit(1).get()
      );
      if (snap.empty) throw new Error("Inscrição não encontrada.");

      const doc = snap.docs[0];
      const d = doc.data();
      window._inscricaoIdAtual = doc.id;
      renderizarPainel(d.idParticipante || doc.id, d);
      telaLogin.classList.add("hidden");
      telaPainel.classList.remove("hidden");
      btnSair.classList.remove("hidden");
      return;
    } catch (err) {
      console.error(`Tentativa ${tentativa} de carregar a inscrição falhou:`, err);

      if (tentativa < maxTentativas) {
        // Provável token ainda não propagado ou instabilidade momentânea: força
        // a renovação do token e tenta de novo antes de desistir.
        try { await user.getIdToken(true); } catch (_) {}
        await new Promise(resolve => setTimeout(resolve, 800));
        continue;
      }

      const erroBox = document.getElementById("loginErro");
      erroBox.textContent = "Não foi possível carregar seus dados agora. Tente entrar novamente em instantes.";
      erroBox.classList.remove("hidden");
      auth.signOut();
    }
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

  iniciarSecaoTime(id, d);
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

// ---- Meu Time (Free Fire / CS2) ----

async function iniciarSecaoTime(id, d) {
  const secao = document.getElementById("secaoTime");
  const elInfo = document.getElementById("timeInfo");
  const elForm = document.getElementById("formCriarTime");

  const elegivel = d.statusPagamento === "aprovado" && (jogoTemTime(d.jogoId) || d.possuiPasse);
  if (!elegivel) {
    secao.classList.add("hidden");
    return;
  }
  secao.classList.remove("hidden");
  elInfo.classList.add("hidden");
  elForm.classList.add("hidden");
  document.getElementById("timeErroCarregamento")?.remove();

  try {
    const membroDoc = await db.collection(COL_TIME_MEMBROS).doc(id).get();
    if (membroDoc.exists) {
      await renderizarTimeExistente(id, membroDoc.data());
    } else {
      prepararFormularioCriarTime(id, d);
    }
  } catch (err) {
    console.error("Erro ao carregar informações do time:", err);
    secao.insertAdjacentHTML("beforeend", `
      <div class="alert alert-error" id="timeErroCarregamento">
        Não foi possível carregar as informações do seu time agora. Recarregue a página em alguns instantes;
        se o problema continuar, avise a organização do torneio.
      </div>
    `);
  }
}

async function renderizarTimeExistente(idParticipante, membroData) {
  const elInfo = document.getElementById("timeInfo");
  document.getElementById("formCriarTime").classList.add("hidden");

  const timeDoc = await db.collection(COL_TIMES).doc(membroData.timeId).get();
  if (!timeDoc.exists) {
    elInfo.classList.add("hidden");
    return;
  }
  const time = timeDoc.data();

  const membrosSnap = await db.collection(COL_TIME_MEMBROS).where("timeId", "==", membroData.timeId).get();
  const membros = membrosSnap.docs.map(d => d.data());

  document.getElementById("timeInfoNome").textContent = time.nome || "—";
  document.getElementById("timeInfoJogo").textContent = nomeJogoParticipante(time.jogoId);

  const listaEl = document.getElementById("timeInfoMembros");
  listaEl.innerHTML = membros.map(m => `
    <div style="display:flex; justify-content:space-between; padding:9px 0; border-bottom:1px solid var(--border); font-size:14px;">
      <span>${m.nomeCompleto}</span>
      <span style="color:var(--text-muted);">${m.idParticipante}${m.idParticipante === time.criadorIdParticipante ? " · Capitão" : ""}</span>
    </div>
  `).join("");

  elInfo.classList.remove("hidden");
}

function nomeJogoParticipante(jogoId) {
  return CATALOGO_JOGOS.find(j => j.id === jogoId)?.nome || jogoId;
}

function prepararFormularioCriarTime(id, d) {
  const elForm = document.getElementById("formCriarTime");
  document.getElementById("timeInfo").classList.add("hidden");

  const campoJogo = document.getElementById("campoTimeJogo");
  const selectJogo = document.getElementById("timeSelectJogo");
  const btnAdd = document.getElementById("btnAddIdTime");
  if (btnAdd) btnAdd.classList.add("hidden"); // time tem tamanho fixo, não dá pra adicionar além do necessário

  if (jogoTemTime(d.jogoId)) {
    campoJogo.classList.add("hidden");
  } else {
    // Passe TJE: participante escolhe pra qual dos dois jogos de time é essa equipe.
    campoJogo.classList.remove("hidden");
  }

  const jogoAtual = () => (jogoTemTime(d.jogoId) ? d.jogoId : selectJogo.value);

  const container = document.getElementById("timeIdsContainer");
  montarCamposIdFixos(container, jogoAtual());

  selectJogo.onchange = () => montarCamposIdFixos(container, jogoAtual());

  elForm.classList.remove("hidden");
  elForm.onsubmit = (e) => criarTime(e, id, d, jogoAtual);
}

// O time precisa fechar com o número exato de integrantes do jogo (Free Fire = 4,
// CS2 = 5), então já mostramos os campos de ID necessários — nada de "adicionar
// mais" ou deixar faltando.
function montarCamposIdFixos(container, jogoId) {
  container.innerHTML = "";
  const qtd = TAMANHO_TIME[jogoId] - 1;
  const label = document.getElementById("labelQtdTime");
  if (label) label.textContent = `Seu ID já entra automaticamente. Informe o ID d${qtd > 1 ? "os outros" : "o outro"} ${qtd} integrante${qtd > 1 ? "s" : ""} (obrigatório — o time de ${nomeJogoParticipante(jogoId)} precisa ter ${TAMANHO_TIME[jogoId]} pessoas):`;
  for (let i = 0; i < qtd; i++) {
    const wrap = document.createElement("div");
    wrap.innerHTML = `
      <input type="text" class="time-id-input" placeholder="ID do participante (ex: TJE2026-0002)" required
        style="width:100%; padding:11px 14px; border:1px solid var(--border); border-radius:9px; background:var(--bg-elevated); color:var(--text);">
    `;
    container.appendChild(wrap);
  }
}

async function criarTime(e, id, d, jogoAtualFn) {
  e.preventDefault();
  const erroBox = document.getElementById("timeErro");
  erroBox.classList.add("hidden");

  const jogoId = jogoAtualFn();
  const nome = document.getElementById("timeInputNome").value.trim();
  if (!nome) {
    mostrarErroTime("Digite o nome do time.");
    return;
  }

  const idsDigitados = Array.from(document.querySelectorAll("#timeIdsContainer .time-id-input"))
    .map(inp => inp.value.trim().toUpperCase())
    .filter(Boolean);

  const idsUnicos = [...new Set(idsDigitados)].filter(x => x !== id);
  const maxIntegrantes = TAMANHO_TIME[jogoId];

  if (idsDigitados.length < maxIntegrantes - 1) {
    mostrarErroTime(`Preencha o ID de todos os integrantes. O time de ${nomeJogoParticipante(jogoId)} precisa ter exatamente ${maxIntegrantes} pessoas (você + ${maxIntegrantes - 1}).`);
    return;
  }
  if (idsUnicos.length !== idsDigitados.length) {
    mostrarErroTime("Você repetiu o mesmo ID em mais de um campo (ou colocou o seu próprio ID, que já entra sozinho). Revise a lista.");
    return;
  }
  if (idsUnicos.length + 1 !== maxIntegrantes) {
    mostrarErroTime(`O time de ${nomeJogoParticipante(jogoId)} precisa ter exatamente ${maxIntegrantes} pessoas (você + ${maxIntegrantes - 1}).`);
    return;
  }

  const btn = document.getElementById("btnCriarTime");
  btn.disabled = true;
  btn.innerHTML = '<div class="spinner"></div> Criando...';

  try {
    // Confere se os colegas informados existem, estão aprovados e jogam esse jogo
    // (ou têm Passe TJE). A checagem final e definitiva é feita pelas regras do
    // Firestore — isso aqui só existe pra dar uma mensagem de erro mais clara.
    const perfis = await Promise.all(idsUnicos.map(idc => db.collection(COL_PARTICIPANTES_PUBLICOS).doc(idc).get()));
    for (let i = 0; i < perfis.length; i++) {
      const p = perfis[i];
      if (!p.exists) throw new Error(`ID ${idsUnicos[i]} não encontrado. Confira se está correto.`);
      const pd = p.data();
      if (pd.jogoId !== jogoId && !pd.possuiPasse) throw new Error(`${idsUnicos[i]} não está inscrito em ${nomeJogoParticipante(jogoId)}.`);
    }

    const jaEmTime = await Promise.all(idsUnicos.map(idc => db.collection(COL_TIME_MEMBROS).doc(idc).get()));
    const ocupado = jaEmTime.find(m => m.exists);
    if (ocupado) throw new Error(`${ocupado.id} já faz parte de outro time.`);

    const timeRef = db.collection(COL_TIMES).doc();
    const batch = db.batch();
    batch.set(timeRef, {
      nome,
      jogoId,
      criadorUid: auth.currentUser.uid,
      criadorIdParticipante: id,
      criadoEm: firebase.firestore.FieldValue.serverTimestamp()
    });
    batch.set(db.collection(COL_TIME_MEMBROS).doc(id), {
      timeId: timeRef.id, jogoId, idParticipante: id,
      nomeCompleto: d.nomeCompleto || "",
      criadoEm: firebase.firestore.FieldValue.serverTimestamp()
    });
    idsUnicos.forEach((idc, i) => {
      batch.set(db.collection(COL_TIME_MEMBROS).doc(idc), {
        timeId: timeRef.id, jogoId, idParticipante: idc,
        nomeCompleto: perfis[i].data().nomeCompleto || "",
        criadoEm: firebase.firestore.FieldValue.serverTimestamp()
      });
    });
    await batch.commit();

    await renderizarTimeExistente(id, { timeId: timeRef.id });
  } catch (err) {
    console.error(err);
    mostrarErroTime(err.message || "Não foi possível criar o time. Tente novamente.");
  }

  btn.disabled = false;
  btn.innerHTML = "Criar time";
}

function mostrarErroTime(msg) {
  const erroBox = document.getElementById("timeErro");
  erroBox.textContent = msg;
  erroBox.classList.remove("hidden");
}

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
  doc.text("Colégio Estadual Malba Tahan — Torneio de Jogos Eletrônicos 2026", 14, y + 12);
  doc.text("Documento gerado eletronicamente pela Área do Participante.", 14, y + 18);

  doc.save(`comprovante-${p.id}.pdf`);
});
