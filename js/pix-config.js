// Preencha aqui os dados reais da conta que vai receber os pagamentos via Pix.
// Depois que preencher, o QR Code e o "Pix Copia e Cola" são gerados
// automaticamente com o valor certo de cada inscrição.
const PIX_CONFIG = {
  // Chave Pix: CPF (só números), CNPJ (só números), e-mail, telefone
  // (formato +55DDNUMERO, ex: +5544999998888) ou chave aleatória.
  chave: "PREENCHER_CHAVE_PIX",

  // Nome do titular da conta Pix. Sem acento, até 25 caracteres.
  nomeRecebedor: "PREENCHER NOME DO RECEBEDOR",

  // Cidade do titular da conta Pix. Sem acento, até 15 caracteres.
  cidade: "PREENCHER CIDADE"
};
