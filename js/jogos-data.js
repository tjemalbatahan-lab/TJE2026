/* ===========================================================
   jogos-data.js — catálogo dos jogos do TJE 2026
   O "id" é também o id do registro na tabela "jogos" do banco de
   dados, onde o admin define o campeão de cada modalidade.
   =========================================================== */

const CATALOGO_JOGOS = [
  { id: "cs2", nome: "CS2", icone: "fa-crosshairs" },
  { id: "freefire", nome: "Free Fire", icone: "fa-fire" },
  { id: "brawlstars", nome: "Brawl Stars", icone: "fa-star" },
  { id: "lol", nome: "League of Legends", icone: "fa-shield-halved" },
  { id: "fc26", nome: "EA Sports FC", icone: "fa-futbol" }
];

const VALOR_JOGO_UNITARIO = 6.0;
const VALOR_PASSE_TJE = 11.9;
const VALOR_PASSE_TJE_ORIGINAL = 14.9; // preço "de", exibido riscado durante a promoção
