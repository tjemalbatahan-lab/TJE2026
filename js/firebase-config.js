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

const appAuxiliar = firebase.initializeApp(firebaseConfig, "auxiliar");
const authAuxiliar = appAuxiliar.auth();

const COL_TURMAS = "turmas";
const COL_JOGOS = "jogos";
const COL_INSCRICOES = "inscricoes";
const COL_ADMINS = "admins";
const COL_CONTADORES = "contadores";

const PASTA_COMPROVANTES = "comprovantes";

const DOMINIO_LOGIN = "participantes.tje2026.app";
