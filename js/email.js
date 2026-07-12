const EMAILJS_PUBLIC_KEY = "eTDb4iwTvFq-TOqdI";
const EMAILJS_SERVICE_ID = "service_07ag8xh";
const EMAILJS_TEMPLATE_ID = "template_dop91w5";

emailjs.init(EMAILJS_PUBLIC_KEY);

function enviarEmailCredenciais(destinatario, nome, idParticipante, senha) {
  return emailjs.send(EMAILJS_SERVICE_ID, EMAILJS_TEMPLATE_ID, {
    to_email: destinatario,
    nome: nome,
    id_participante: idParticipante,
    senha: senha,
    link_acesso: "https://tjemalbatahan-lab.github.io/TJE2026/area-participante.html"
  });
}
