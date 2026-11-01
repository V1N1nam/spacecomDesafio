const { parseDataset } = require('../src/parser');

for (let n = 1; n <= 6; n++) {
  const regs = parseDataset(`data/input/dataset${n}.txt`);

  const vistos = new Set();
  let duplicados = 0, invalidos = 0, foraDeOrdem = 0;
  let anterior = '';

  for (const r of regs) {
    const k = `${r.id}|${r.timestamp}`;
    if (vistos.has(k)) duplicados++;
    vistos.add(k);

    if (isNaN(r.id) || isNaN(r.lat) || isNaN(r.lon) || !r.timestamp) invalidos++;

    if (r.timestamp < anterior) foraDeOrdem++;
    anterior = r.timestamp;
  }

  console.log(`dataset${n}: duplicados ${duplicados}, invalidos ${invalidos}, fora de ordem ${foraDeOrdem}`);
}