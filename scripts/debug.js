const { parseDataset } = require('../src/parser');
const { haversine } = require('../src/haversine');

const regs = parseDataset('data/input/dataset1.txt');
const grupo = regs.filter(r => r.timestamp === '2024-01-01 00:16:45');

const a = grupo.find(r => r.id === 9);
const b = grupo.find(r => r.id === 10);
console.log('vitima:', a);
console.log('agressor:', b);
console.log('distancia:', haversine(a.lat, a.lon, b.lat, b.lon));
console.log('diff lat:', b.lat - a.lat);

grupo.sort((p, q) => p.lat - q.lat);
console.log('ordem apos sort:', grupo.map(r => `${r.id}:${r.lat}`).join('  '));