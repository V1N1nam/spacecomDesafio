const fs = require('fs');
const readline = require('readline');

function parseLinha(linha) {
  linha = linha.trim();
  if (!linha) return null;

  const c = linha.replace(/"/g, '').split(';');
  return {
    id: Number(c[0]),
    faccao: c[1] || null,
    timestamp: c[2],
    lat: Number(c[3]),
    lon: Number(c[4]),
    protetiva: c[5].toLowerCase() === 'true',
    agressores: c[6] ? c[6].split(',').map(Number) : []
  };
}

function parseDataset(caminho) {
  const linhas = fs.readFileSync(caminho, 'utf8').split(/\r?\n/);
  const registros = [];
  for (let i = 1; i < linhas.length; i++) {
    const r = parseLinha(linhas[i]);
    if (r) registros.push(r);
  }
  return registros;
}

async function lerPorTimestamp(caminho, aoCompletarGrupo) {
  const rl = readline.createInterface({
    input: fs.createReadStream(caminho),
    crlfDelay: Infinity 
  });

  let atual = null;
  let grupo = [];
  let cabecalho = true;
  let total = 0;

  for await (const linha of rl) {
    if (cabecalho) { cabecalho = false; continue; }

    const r = parseLinha(linha);
    if (!r) continue;
    total++;

    if (r.timestamp !== atual) {
      if (atual !== null && r.timestamp < atual) {
        throw new Error(`Arquivo fora de ordem em ${r.timestamp}`);
      }
      if (grupo.length) aoCompletarGrupo(atual, grupo);
      atual = r.timestamp;
      grupo = [];
    }
    grupo.push(r);
  }

  if (grupo.length) aoCompletarGrupo(atual, grupo); 
  return total;
}

module.exports = { parseLinha, parseDataset, lerPorTimestamp };