/* ===========================================================
   firebase-config.js — TJE 2026
   Projeto Firebase já configurado — nenhuma chave nova precisa
   ser trocada aqui.
   =========================================================== */

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
const storage = firebase.storage();

// App secundário — usado SÓ no painel do admin, no momento de criar
// o login do participante aprovado (createUserWithEmailAndPassword).
// Sem isso, criar o login do participante substituiria a sessão do
// próprio admin logado no navegador.
const appAuxiliar = firebase.initializeApp(firebaseConfig, "auxiliar");
const authAuxiliar = appAuxiliar.auth();

// Coleções do Firestore
const COL_TURMAS = "turmas";
const COL_JOGOS = "jogos";
const COL_INSCRICOES = "inscricoes";
const COL_ADMINS = "admins";
const COL_CONTADORES = "contadores";

// Pasta do Storage onde ficam os comprovantes de pagamento
const PASTA_COMPROVANTES = "comprovantes";

// Domínio usado pro e-mail sintético do login por ID
// (ex: tje2026-0001@participantes.tje2026.app)
const DOMINIO_LOGIN = "participantes.tje2026.app";
