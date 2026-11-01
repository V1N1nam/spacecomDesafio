const fs = require('fs');
const { lerPorTimestamp } = require('./parser');
const { detectarNoGrupo } = require('./detector');

async function main() {
  for (let n = 1; n <= 7; n++) {
    const inicio = performance.now();
    const encontros = [];

    const linhas = await lerPorTimestamp(`data/input/dataset${n}.txt`, (timestamp, pessoas) => {
      encontros.push(...detectarNoGrupo(timestamp, pessoas));
    });

    const tempo = (performance.now() - inicio).toFixed(1);
    fs.writeFileSync(`output/resultado${n}.json`, JSON.stringify(encontros, null, 2));
    console.log(`dataset${n}: ${linhas} linhas, ${encontros.length} encontros, ${tempo} ms`);
  }
}

main();