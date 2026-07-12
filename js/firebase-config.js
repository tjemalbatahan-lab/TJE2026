const firebaseConfig = {
  apiKey: "AIzaSyDPOygyRai5v9qN7f8gUApjhgHjwLAxV2k",
  authDomain: "tje2026-1d6b7.firebaseapp.com",
  projectId: "tje2026-1d6b7",
  storageBucket: "tje2026-1d6b7.firebasestorage.app",
  messagingSenderId: "970413779738",
  appId: "1:970413779738:web:ec0221ef94072aeaa6daa3"
};

firebase.initializeApp(firebaseConfig);

const db = firebase.firestore();
const auth = firebase.auth();

// Safari/iOS têm um bug conhecido do WebKit em que a conexão do IndexedDB
// (usada pela persistência padrão do Firebase Auth) trava/nunca responde,
// fazendo o login "piscar" e voltar pra tela de entrar. Nesses navegadores,
// usamos sessionStorage em vez de IndexedDB, que não sofre desse bug.
(function configurarPersistenciaAuth() {
  const ua = navigator.userAgent;
  const isIOS = /iPad|iPhone|iPod/.test(ua) || (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1);
  const isSafari = /^((?!chrome|android|crios|fxios).)*safari/i.test(ua);

  const persistencia = (isIOS || isSafari)
    ? firebase.auth.Auth.Persistence.SESSION
    : firebase.auth.Auth.Persistence.LOCAL;

  auth.setPersistence(persistencia).catch((err) => {
    console.error("Falha ao configurar persistência do login, usando modo em memória:", err);
    auth.setPersistence(firebase.auth.Auth.Persistence.NONE).catch(() => {});
  });
})();

const appAuxiliar = firebase.initializeApp(firebaseConfig, "auxiliar");
const authAuxiliar = appAuxiliar.auth();

const COL_TURMAS = "turmas";
const COL_JOGOS = "jogos";
const COL_INSCRICOES = "inscricoes";
const COL_ADMINS = "admins";
const COL_CONTADORES = "contadores";
const COL_TIMES = "times";
const COL_TIME_MEMBROS = "time_membros";
const COL_PARTICIPANTES_PUBLICOS = "participantes_publicos";

const DOMINIO_LOGIN = "participantes.tje2026.app";

// Em alguns navegadores (bug conhecido do Safari/iOS com IndexedDB), a chamada
// de login pode travar sem nunca resolver nem rejeitar. Esse helper garante
// que, depois de alguns segundos sem resposta, a operação falhe com uma
// mensagem clara em vez de ficar girando pra sempre.
function comTimeout(promise, ms = 10000) {
  return Promise.race([
    promise,
    new Promise((_, reject) =>
      setTimeout(() => reject(new Error("TIMEOUT_CONEXAO")), ms)
    )
  ]);
}
