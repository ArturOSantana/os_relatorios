// ─── UTILITÁRIOS ─────────────────────────────────────────────

function fmtData(str) {
  if (!str) return '';
  const [a, m, d] = str.split('-');
  return `${d}/${m}/${a}`;
}

function fmtMes(str) {
  if (!str) return '';
  const [a, m] = str.split('-');
  return new Date(a, m - 1).toLocaleString('pt-BR', { month: 'long', year: 'numeric' }).toUpperCase();
}

function hoje() {
  return new Date().toISOString().split('T')[0];
}

function toast(msg) {
  const el = document.getElementById('toast');
  if (!el) return;
  el.textContent = msg;
  el.classList.add('show');
  clearTimeout(el._timer);
  el._timer = setTimeout(() => el.classList.remove('show'), 2800);
}

function abrirModal(id) {
  document.getElementById(id).classList.add('open');
}

function fecharModal(id) {
  document.getElementById(id).classList.remove('open');
}

function copiarTextoEl(id) {
  const el = document.getElementById(id);
  if (!el) return;
  navigator.clipboard.writeText(el.textContent).then(() => toast('Copiado.'));
}

function abrirWapp(id) {
  const el = document.getElementById(id);
  if (!el) return;
  const txt = el.textContent;
  window.open('https://wa.me/?text=' + encodeURIComponent(txt), '_blank');
}

function escapeHtml(str) {
  const div = document.createElement('div');
  div.textContent = str;
  return div.innerHTML;
}

function calcTotal(lideres) {
  return lideres.reduce((s, l) => s + l.qtd, 0);
}

function generateId() {
  return Date.now() + '_' + Math.random().toString(36).slice(2, 6);
}