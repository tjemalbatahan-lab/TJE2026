const CATALOGO_JOGOS = [
  { id: "cs2", nome: "CS2", icone: "fa-crosshairs" },
  { id: "brawlstars", nome: "Brawl Stars", icone: "fa-star" },
  { id: "clashroyale", nome: "Clash Royale", icone: "fa-chess-rook" },
  { id: "streetfighter", nome: "Street Fighter", icone: "fa-hand-fist" },
  { id: "freefire", nome: "Free Fire", icone: "fa-fire" }
];

const VALOR_JOGO_UNITARIO = 6.0;
const VALOR_PASSE_TJE = 11.9;
const VALOR_PASSE_TJE_ORIGINAL = 14.9;

// Jogos que são disputados em equipe. Só esses dois têm a funcionalidade de "Time".
const TAMANHO_TIME = { freefire: 4, cs2: 5 };
function jogoTemTime(jogoId) {
  return Object.prototype.hasOwnProperty.call(TAMANHO_TIME, jogoId);
}
