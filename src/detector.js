const { haversine } = require('./haversine');
const { classificar } = require('./classifier');

const LIMITE = 20; // metros
const RAIO_TERRA = 6371000;
const LIMITE_GRAUS_LAT = (LIMITE / RAIO_TERRA) * (180 / Math.PI) * 1.001;

// recebe todas as pessoas de UM timestamp e devolve os encontros dele
function detectarNoGrupo(timestamp, pessoas) {
    pessoas.sort((p, q) => p.lat - q.lat);
    const encontros = [];

  for (let i = 0; i < pessoas.length; i++) {
    for (let j = i + 1; j < pessoas.length; j++){
      const a = pessoas[i];
      const b = pessoas[j];

       if (b.lat - a.lat >= LIMITE_GRAUS_LAT) break; 

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