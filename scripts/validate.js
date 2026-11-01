const fs = require('fs');

function chave(e) {
  const [x, y] = e.monitoradosEncontro.map(Number).sort((p, q) => p - q);
  return `${e.timestamp}|${x}|${y}|${e.tipo}`;
}

for (const n of [1, 2, 3, 4, 5, 6, 7]) {
  const esperado = JSON.parse(fs.readFileSync(`data/referencia/resultado${n}.json`, 'utf8'));
  const obtido = JSON.parse(fs.readFileSync(`output/resultado${n}.json`, 'utf8'));

  const setEsperado = new Set(esperado.map(chave));
  const setObtido = new Set(obtido.map(chave));

  const faltantes = [...setEsperado].filter(k => !setObtido.has(k));
  const falsos = [...setObtido].filter(k => !setEsperado.has(k));
  const acertos = setObtido.size - falsos.length;

  console.log(`\ndataset${n}: esperado ${setEsperado.size}, obtido ${setObtido.size}`);
  console.log(`  acertos: ${acertos} | faltantes: ${faltantes.length} | falsos positivos: ${falsos.length}`);
  if (faltantes.length) console.log('  faltantes:', faltantes);
  if (falsos.length) console.log('  falsos:', falsos);
}