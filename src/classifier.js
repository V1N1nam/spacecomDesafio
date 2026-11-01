function classificar(a, b) {
  if (a.protetiva && a.agressores.includes(b.id)) return 'protetiva';
  if (b.protetiva && b.agressores.includes(a.id)) return 'protetiva'; 

  if (a.protetiva || b.protetiva) return null;

  if (a.faccao && a.faccao === b.faccao) return 'faccao';

  return 'generico';
}

module.exports = { classificar };