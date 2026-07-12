// Monta o "Pix Copia e Cola" (BR Code / EMV) com o valor exato da inscrição,
// e o CRC16 é calculado localmente. Isso é público e não precisa de nenhuma API.

function campoEMV(id, valor) {
  const tamanho = String(valor.length).padStart(2, "0");
  return `${id}${tamanho}${valor}`;
}

function crc16Pix(payload) {
  const polinomio = 0x1021;
  let resultado = 0xffff;

  for (let i = 0; i < payload.length; i++) {
    resultado ^= payload.charCodeAt(i) << 8;
    for (let j = 0; j < 8; j++) {
      resultado =
        (resultado & 0x8000) !== 0
          ? ((resultado << 1) ^ polinomio) & 0xffff
          : (resultado << 1) & 0xffff;
    }
  }
  return resultado.toString(16).toUpperCase().padStart(4, "0");
}

function removerAcentosPix(txt) {
  return (txt || "").normalize("NFD").replace(/[\u0300-\u036f]/g, "");
}

function montarPayloadPix({ chave, nomeRecebedor, cidade, valor, txid }) {
  const nome = removerAcentosPix(nomeRecebedor).toUpperCase().slice(0, 25);
  const cidadeFormatada = removerAcentosPix(cidade).toUpperCase().slice(0, 15);
  const txidFormatado = (txid || "***").replace(/[^A-Za-z0-9]/g, "").slice(0, 25) || "***";
  const valorFormatado = Number(valor).toFixed(2);

  const infoConta = campoEMV("00", "br.gov.bcb.pix") + campoEMV("01", chave);

  let payload =
    campoEMV("00", "01") +
    campoEMV("26", infoConta) +
    campoEMV("52", "0000") +
    campoEMV("53", "986") +
    campoEMV("54", valorFormatado) +
    campoEMV("58", "BR") +
    campoEMV("59", nome) +
    campoEMV("60", cidadeFormatada) +
    campoEMV("62", campoEMV("05", txidFormatado));

  payload += "6304";
  return payload + crc16Pix(payload);
}

// Gera o QR Code (data URL de imagem) a partir do payload do Pix.
function gerarQrCodePixDataUrl(payload) {
  const qr = qrcode(0, "M"); // 0 = detecta o tamanho automaticamente, M = correção de erro média
  qr.addData(payload);
  qr.make();
  return qr.createDataURL(6, 6);
}
