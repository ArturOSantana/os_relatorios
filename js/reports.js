// ─── RELATÓRIOS (formatação) ───────────────────────────────

function gerarFormal(r) {
  const sep = '─'.repeat(44);
  const orig = (r.origens || []).join(' / ') || 'Não informado';
  let t = '';
  t += `PENDÊNCIAS DE O.S ${(r.tipo||'CORRETIVA').toUpperCase()}\n`;
  t += `Origem: ${orig}\n`;
  t += sep + '\n';
  t += `Data   : ${fmtData(r.data)}\n`;
  t += `Período: ${r.periodo}\n`;
  t += sep + '\n';
  t += `LÍDERES RESPONSÁVEIS\n\n`;
  (r.lideres || []).forEach(l => {
    const n = (l.nome || '').padEnd(30);
    const q = String(l.qtd).padStart(2, '0');
    t += `  ${n}  ${q} O.S\n`;
  });
  t += '\n' + sep + '\n';
  t += `TOTAL NÃO ENTREGUE: ${r.total} O.S\n`;
  if (r.obs) t += `\nObs: ${r.obs}\n`;
  return t;
}

function gerarWapp(r, lideresFilter = null) {
  const orig = (r.origens || []).join(' / ') || 'Não informado';
  const lideres = lideresFilter
    ? (r.lideres || []).filter(l => lideresFilter.includes(l.nome))
    : (r.lideres || []);
  const total = lideres.reduce((s, l) => s + l.qtd, 0);
  let t = '';
  t += `*PENDÊNCIAS O.S ${(r.tipo||'CORRETIVA').toUpperCase()}*\n`;
  t += `_Origem: ${orig}_\n\n`;
  t += `*Data: ${fmtData(r.data)}*\n`;
  t += `*Período: ${r.periodo}*\n\n`;
  t += `*Não entregue: ${total}*\n\n`;
  lideres.forEach(l => { t += `${l.qtd} O.S — ${l.nome}\n`; });
  if (r.obs) t += `\n_Obs: ${r.obs}_\n`;
  return t;
}