const EMAILJS_PUBLIC_KEY = "COLOQUE_SUA_PUBLIC_KEY_AQUI";
const EMAILJS_SERVICE_ID = "COLOQUE_SEU_SERVICE_ID_AQUI";
const EMAILJS_TEMPLATE_ID = "COLOQUE_SEU_TEMPLATE_ID_AQUI";

emailjs.init(EMAILJS_PUBLIC_KEY);

function enviarEmailCredenciais(destinatario, nome, idParticipante, senha) {
  return emailjs.send(EMAILJS_SERVICE_ID, EMAILJS_TEMPLATE_ID, {
    to_email: destinatario,
    nome: nome,
    id_participante: idParticipante,
    senha: senha,
    link_acesso: window.location.origin + "/area-participante.html"
  });
}
