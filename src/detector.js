const { haversine } = require('./haversine');
const { classificar } = require('./classifier');

const LIMITE = 20;

function detectarNoGrupo(timestamp, pessoas) {
  const encontros = [];

  for (let i = 0; i < pessoas.length; i++) {
    for (let j = i + 1; j < pessoas.length; j++) {
      const a = pessoas[i];
      const b = pessoas[j];

      const dist = haversine(a.lat, a.lon, b.lat, b.lon);
      if (dist >= LIMITE) continue;

      const tipo = classificar(a, b);
      if (!tipo) continue;

      encontros.push({
        tipo,
        monitoradosEncontro: [a.id, b.id],
        timestamp,
        posicoes: {
          [a.id]: { lat: a.lat, lon: a.lon },
          [b.id]: { lat: b.lat, lon: b.lon }
        },
        distanciaMetros: dist
      });
    }
  }

  return encontros;
}

module.exports = { detectarNoGrupo };