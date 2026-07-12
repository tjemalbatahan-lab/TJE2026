/* ===========================================================
   turmas.js — carrega as turmas cadastradas no Firestore
   Atualiza automaticamente quando o admin adiciona/edita/remove
   uma turma (onSnapshot em tempo real, sem precisar recarregar).
   =========================================================== */

function carregarTurmasNoSelect(selectId = "turmaSelect") {
  const select = document.getElementById(selectId);
  if (!select) return;

  db.collection(COL_TURMAS)
    .where("ativo", "==", true)
    .orderBy("nome")
    .onSnapshot(
      snapshot => {
        const valorAtual = select.value;
        select.innerHTML = '<option value="" disabled selected>Selecione sua turma</option>';

        if (snapshot.empty) {
          select.innerHTML = '<option value="" disabled selected>Nenhuma turma disponível</option>';
          return;
        }

        snapshot.forEach(doc => {
          const turma = doc.data();
          const opt = document.createElement("option");
          opt.value = doc.id;
          opt.textContent = turma.nome;
          select.appendChild(opt);
        });

        if (valorAtual) select.value = valorAtual;
      },
      erro => {
        console.error("Erro ao carregar turmas:", erro);
        select.innerHTML = '<option value="" disabled selected>Erro ao carregar turmas</option>';
      }
    );
}

document.addEventListener("DOMContentLoaded", () => carregarTurmasNoSelect());
