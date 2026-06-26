// ─── ESTADO GLOBAL ──────────────────────────────────────────

let DB = {
  registros: [],
  lideres: [
    { id: 1, nome: 'Durval Mobi', turno: 'Manhã' },
    { id: 2, nome: 'Jose Maximo', turno: 'Manhã' },
    { id: 3, nome: 'Alessandro Araujo Lider', turno: 'Manhã' },
    { id: 4, nome: 'Beto', turno: 'Manhã' },
    { id: 5, nome: 'Isabella Mobi Noite', turno: 'Noturno' },
    { id: 6, nome: 'Renato Souto', turno: 'Noturno' },
    { id: 7, nome: 'Jose Euclides', turno: 'Noturno' },
  ],
  origens: ['Recolhida Normal', 'Avaria', 'Telemetria']
};

let editandoId = null;
let histSelecionado = null;

// ─── PERSISTÊNCIA ────────────────────────────────────────────

function save() {
  localStorage.setItem('scp_db', JSON.stringify(DB));
}

function loadDB() {
  const saved = localStorage.getItem('scp_db');
  if (saved) {
    try {
      const parsed = JSON.parse(saved);
      DB = parsed;
      if (!DB.lideres) DB.lideres = [];
      if (!DB.origens) DB.origens = ['Recolhida Normal', 'Avaria', 'Telemetria'];
      if (!DB.registros) DB.registros = [];
    } catch (e) {}
  }
}

// ─── INICIALIZAÇÃO ──────────────────────────────────────────

function init() {
  loadDB();

  // Configurar navegação
  document.querySelectorAll('nav a[data-page]').forEach(a => {
    a.addEventListener('click', e => {
      e.preventDefault();
      navTo(a.dataset.page);
    });
  });

  // Definir data padrão no formulário
  const dataInput = document.getElementById('f-data');
  if (dataInput) dataInput.value = hoje();

  // Construir botões de origens e adicionar linha de líder
  buildOrigensBtns();
  addLiderRow();

  // Navegar para dashboard inicial
  navTo('dashboard');

  // Fechar modais clicando fora
  document.querySelectorAll('.modal-backdrop').forEach(bd => {
    bd.addEventListener('click', e => {
      if (e.target === bd) bd.classList.remove('open');
    });
  });
}

// ─── NAVEGAÇÃO ──────────────────────────────────────────────

const pageTitles = {
  dashboard: 'Dashboard',
  registro: 'Novo Registro',
  historico: 'Histórico de Registros',
  relatorios: 'Relatórios',
  graficos: 'Gráficos',
  ranking: 'Ranking de Líderes',
  lideres: 'Cadastro de Líderes',
  origens: 'Cadastro de Origens',
  dados: 'Dados e Backup',
};

function navTo(page) {
  // Esconder todas as páginas
  document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
  // Mostrar a página alvo
  const target = document.getElementById(`page-${page}`);
  if (target) target.classList.add('active');

  // Atualizar menu
  document.querySelectorAll('nav a').forEach(a => a.classList.remove('active'));
  const link = document.querySelector(`nav a[data-page="${page}"]`);
  if (link) link.classList.add('active');

  // Atualizar título da topbar
  document.getElementById('topbar-title').textContent = pageTitles[page] || page;
  document.getElementById('topbar-actions').innerHTML = '';

  // Chamar funções de renderização específicas
  switch (page) {
    case 'dashboard': renderDashboard(); break;
    case 'historico': populateFiltrosHist(); renderHistorico(); break;
    case 'relatorios': populateRelFiltros(); break;
    case 'graficos': populateGrafMes(); renderGraficos(); break;
    case 'ranking': populateRankFiltros(); renderRanking(); break;
    case 'lideres': renderLideresCad(); break;
    case 'origens': renderOrigensCad(); break;
    case 'dados': renderDadosResumo(); break;
    case 'registro': buildOrigensBtns(); atualizarPreview(); break;
  }
}

// ─── DASHBOARD ──────────────────────────────────────────────

function renderDashboard() {
  const regs = DB.registros;
  const total = regs.reduce((s, r) => s + r.total, 0);
  const mesAtual = hoje().slice(0, 7);
  const regsEsseMes = regs.filter(r => r.data.startsWith(mesAtual));
  const totalMes = regsEsseMes.reduce((s, r) => s + r.total, 0);
  const media = regsEsseMes.length ? Math.round(totalMes / regsEsseMes.length) : 0;
  let maiorDia = 0;
  regsEsseMes.forEach(r => { if (r.total > maiorDia) maiorDia = r.total; });

  const statsEl = document.getElementById('dash-stats');
  if (statsEl) {
    statsEl.innerHTML = `
      <div class="stat-card red">
        <div class="label">Total Histórico</div>
        <div class="value red">${total}</div>
        <div class="sub">O.S não entregues</div>
      </div>
      <div class="stat-card amber">
        <div class="label">Este Mês</div>
        <div class="value amber">${totalMes}</div>
        <div class="sub">${regsEsseMes.length} registros</div>
      </div>
      <div class="stat-card blue">
        <div class="label">Média por Dia</div>
        <div class="value">${media}</div>
        <div class="sub">O.S / dia (mês atual)</div>
      </div>
      <div class="stat-card green">
        <div class="label">Pior Dia do Mês</div>
        <div class="value">${maiorDia}</div>
        <div class="sub">máxima de pendências</div>
      </div>
    `;
  }

  renderChartSemana();
  renderChartPeriodoDash();
  renderDashRanking();
  renderDashRecentes();
}

function renderDashRanking() {
  const mesAtual = hoje().slice(0, 7);
  const regs = DB.registros.filter(r => r.data.startsWith(mesAtual));
  const mapa = {};
  regs.forEach(r => r.lideres.forEach(l => {
    mapa[l.nome] = (mapa[l.nome] || 0) + l.qtd;
  }));
  const sorted = Object.entries(mapa).sort((a, b) => b[1] - a[1]).slice(0, 6);
  const max = sorted[0]?.[1] || 1;
  const el = document.getElementById('dash-ranking');
  if (!el) return;
  if (!sorted.length) {
    el.innerHTML = '<p style="font-size:11px;color:var(--text3)">Sem dados neste mês.</p>';
    return;
  }
  el.innerHTML = sorted.map(([nome, val], i) => `
    <div class="ranking-item">
      <span class="ranking-pos">${i + 1}</span>
      <span class="ranking-name">${nome}</span>
      <div class="ranking-bar-wrap">
        <div class="progress-bar"><div class="progress-fill" style="width:${Math.round(val/max*100)}%"></div></div>
      </div>
      <span class="ranking-val">${val}</span>
    </div>
  `).join('');
}

function renderDashRecentes() {
  const el = document.getElementById('dash-recentes');
  if (!el) return;
  const regs = DB.registros.slice(0, 5);
  if (!regs.length) {
    el.innerHTML = '<p style="font-size:11px;color:var(--text3)">Nenhum registro ainda.</p>';
    return;
  }
  el.innerHTML = regs.map(r => `
    <div style="display:flex;align-items:center;justify-content:space-between;padding:8px 0;border-bottom:1px solid var(--border)">
      <div>
        <div style="font-size:12px;font-weight:600">${fmtData(r.data)}</div>
        <div style="font-size:10px;color:var(--text3)">${r.periodo} — ${r.lideres.map(l=>l.nome).join(', ')}</div>
      </div>
      <span style="font-family:var(--mono);font-size:18px;font-weight:700;color:var(--red)">${r.total}</span>
    </div>
  `).join('');
}

// ─── FORMULÁRIO DE REGISTRO ────────────────────────────────

function buildOrigensBtns() {
  const wrap = document.getElementById('f-origens-group');
  if (!wrap) return;
  wrap.innerHTML = '';
  DB.origens.forEach(o => {
    const btn = document.createElement('div');
    btn.className = 'toggle-btn on';
    btn.dataset.val = o;
    btn.textContent = o;
    btn.onclick = function() {
      this.classList.toggle('on');
      atualizarPreview();
    };
    wrap.appendChild(btn);
  });
}

function getOrigensAtivas() {
  return [...document.querySelectorAll('#f-origens-group .toggle-btn.on')].map(b => b.dataset.val);
}

function addLiderRow(nome = '', qtd = '') {
  const c = document.getElementById('f-lideres-container');
  if (!c) return;
  const row = document.createElement('div');
  row.className = 'lider-row-form';
  row.innerHTML = `
    <div class="autocomplete-wrap">
      <input type="text" class="form-input" placeholder="Nome do líder" value="${nome}"
        oninput="autocompleteInput(this); atualizarPreview()"
        onfocus="autocompleteShow(this)"
        onblur="setTimeout(()=>hideAC(this),200)"
        style="font-size:12px">
      <div class="autocomplete-list"></div>
    </div>
    <input type="number" class="form-input" placeholder="0" min="0" value="${qtd}"
      oninput="atualizarPreview()" style="text-align:center;font-size:13px;font-weight:700">
    <button class="btn-icon" onclick="this.parentElement.remove(); atualizarPreview()">x</button>
  `;
  c.appendChild(row);
  atualizarPreview();
}

function autocompleteInput(el) {
  const v = el.value.toLowerCase();
  const list = el.nextElementSibling;
  const matches = DB.lideres.filter(l => l.nome.toLowerCase().includes(v) && v.length > 0);
  if (matches.length === 0) { list.style.display = 'none'; return; }
  list.innerHTML = matches.map(l =>
    `<div class="autocomplete-item" onmousedown="selectAC(this,'${l.nome.replace(/'/g,"\\'")}')">
      ${l.nome} <span style="font-size:10px;color:var(--text3)">${l.turno}</span>
    </div>`
  ).join('');
  list.style.display = 'block';
}

function autocompleteShow(el) {
  if (el.value.trim()) autocompleteInput(el);
}

function selectAC(item, nome) {
  const wrap = item.closest('.autocomplete-wrap');
  wrap.querySelector('input').value = nome;
  item.closest('.autocomplete-list').style.display = 'none';
  atualizarPreview();
}

function hideAC(el) {
  el.nextElementSibling.style.display = 'none';
}

function getLideresForm() {
  const rows = document.querySelectorAll('#f-lideres-container .lider-row-form');
  const lista = [];
  rows.forEach(row => {
    const nome = row.querySelector('input[type=text]').value.trim();
    const qtd = parseInt(row.querySelector('input[type=number]').value) || 0;
    if (nome || qtd) lista.push({ nome, qtd });
  });
  return lista;
}

function atualizarPreview() {
  const data = document.getElementById('f-data')?.value || '';
  const periodo = document.getElementById('f-periodo')?.value || '';
  const tipo = document.getElementById('f-tipo')?.value || 'Corretiva';
  const origens = getOrigensAtivas();
  const lideres = getLideresForm();
  const obs = document.getElementById('f-obs')?.value?.trim() || '';
  const total = calcTotal(lideres);

  const tw = document.getElementById('f-total-wrap');
  if (tw) {
    tw.style.display = total > 0 ? 'flex' : 'none';
    document.getElementById('f-total-num').textContent = total;
  }

  const preview = document.getElementById('preview-text');
  if (preview) {
    const r = { data, periodo, tipo, origens, lideres, total, obs };
    preview.textContent = gerarFormal(r);
  }
}

function salvarRegistro() {
  const data = document.getElementById('f-data').value;
  if (!data) { toast('Informe a data.'); return; }
  const lideres = getLideresForm().filter(l => l.nome);
  if (!lideres.length) { toast('Adicione ao menos um líder.'); return; }

  const reg = {
    id: Date.now(),
    data,
    periodo: document.getElementById('f-periodo').value,
    tipo: document.getElementById('f-tipo')?.value || 'Corretiva',
    origens: getOrigensAtivas(),
    lideres,
    total: calcTotal(lideres),
    obs: document.getElementById('f-obs').value.trim(),
    criadoEm: new Date().toISOString()
  };

  DB.registros.unshift(reg);
  save();
  limparForm();
  toast('Registro salvo.');
}

function limparForm() {
  document.getElementById('f-data').value = hoje();
  document.getElementById('f-periodo').value = 'Manhã';
  document.getElementById('f-obs').value = '';
  document.getElementById('f-lideres-container').innerHTML = '';
  buildOrigensBtns();
  addLiderRow();
  atualizarPreview();
}

// ─── HISTÓRICO ──────────────────────────────────────────────

function populateFiltrosHist() {
  const meses = [...new Set(DB.registros.map(r => r.data.slice(0, 7)))].sort().reverse();
  const mesEl = document.getElementById('hist-mes');
  if (mesEl) {
    mesEl.innerHTML = '<option value="">Todos os meses</option>' +
      meses.map(m => `<option value="${m}">${fmtMes(m + '-01')}</option>`).join('');
  }

  const nomes = [...new Set(DB.registros.flatMap(r => r.lideres.map(l => l.nome)))].sort();
  const lidEl = document.getElementById('hist-lider');
  if (lidEl) {
    lidEl.innerHTML = '<option value="">Todos os líderes</option>' +
      nomes.map(n => `<option value="${n}">${n}</option>`).join('');
  }
}

function limparFiltrosHist() {
  document.getElementById('hist-busca').value = '';
  document.getElementById('hist-periodo').value = '';
  document.getElementById('hist-mes').value = '';
  document.getElementById('hist-lider').value = '';
  renderHistorico();
}

function renderHistorico() {
  const busca = (document.getElementById('hist-busca')?.value || '').toLowerCase();
  const periodo = document.getElementById('hist-periodo')?.value || '';
  const mes = document.getElementById('hist-mes')?.value || '';
  const lider = document.getElementById('hist-lider')?.value || '';

  let regs = DB.registros.filter(r => {
    if (periodo && r.periodo !== periodo) return false;
    if (mes && !r.data.startsWith(mes)) return false;
    if (lider && !r.lideres.some(l => l.nome === lider)) return false;
    if (busca) {
      const haystack = (r.obs + ' ' + r.lideres.map(l=>l.nome).join(' ')).toLowerCase();
      if (!haystack.includes(busca)) return false;
    }
    return true;
  });

  const lista = document.getElementById('hist-lista');
  if (!lista) return;
  if (!regs.length) {
    lista.innerHTML = '<div class="empty-state"><div class="ico">—</div><p>Nenhum registro encontrado.</p></div>';
    return;
  }

  const grupos = {};
  regs.forEach(r => {
    const k = r.data.slice(0, 7);
    if (!grupos[k]) grupos[k] = [];
    grupos[k].push(r);
  });

  lista.innerHTML = Object.keys(grupos).sort().reverse().map(k => {
    const itens = grupos[k];
    const tot = itens.reduce((s, r) => s + r.total, 0);
    return `
      <div class="month-group-label">${fmtMes(k + '-01')} — ${tot} O.S</div>
      ${itens.map(r => regCard(r)).join('')}
    `;
  }).join('');
}

function regCard(r) {
  const sel = histSelecionado === r.id ? 'sel' : '';
  const lidesStr = r.lideres.map(l => `${l.nome} (${l.qtd})`).join(' / ');
  return `
  <div class="reg-card ${sel}" onclick="selecionarReg(${r.id})" data-id="${r.id}">
    <div class="reg-card-actions">
      <button class="btn btn-ghost btn-sm" onclick="event.stopPropagation();editarReg(${r.id})">Editar</button>
      <button class="btn btn-ghost btn-sm" onclick="event.stopPropagation();duplicarReg(${r.id})">Duplicar</button>
      <button class="btn btn-danger btn-sm" onclick="event.stopPropagation();excluirReg(${r.id})">x</button>
    </div>
    <div class="reg-card-head">
      <span class="reg-card-date">${fmtData(r.data)}</span>
      <div class="reg-card-total">
        <div class="num">${r.total}</div>
        <div class="lbl">não entregues</div>
      </div>
    </div>
    <div class="reg-card-meta">
      <span class="tag tag-blue">${r.periodo}</span>
      ${(r.origens||[]).map(o => `<span class="tag tag-amber">${o}</span>`).join('')}
      ${r.tipo ? `<span class="tag tag-gray">${r.tipo}</span>` : ''}
    </div>
    <div class="reg-card-lideres">${lidesStr}</div>
  </div>`;
}

function selecionarReg(id) {
  histSelecionado = id;
  renderHistorico();
  const r = DB.registros.find(x => x.id === id);
  if (!r) return;

  const relatorioDiv = document.getElementById('hist-relatorio');
  if (!relatorioDiv) return;
  relatorioDiv.style.display = 'block';

  const formalEl = document.getElementById('hist-rel-formal');
  const wappEl = document.getElementById('hist-rel-wapp');
  if (formalEl) formalEl.textContent = gerarFormal(r);
  if (wappEl) wappEl.textContent = gerarWapp(r);

  const wl = document.getElementById('hist-wapp-lideres');
  if (wl) {
    wl.innerHTML = r.lideres.map(l => `
      <label class="checkbox-label">
        <input type="checkbox" checked onchange="atualizarWappFiltrado(${id})">
        ${l.nome}
      </label>
    `).join('');
  }

  relatorioDiv.scrollIntoView({ behavior: 'smooth' });
}

function atualizarWappFiltrado(id) {
  const r = DB.registros.find(x => x.id === id);
  if (!r) return;
  const checks = document.querySelectorAll('#hist-wapp-lideres input[type=checkbox]');
  const selecionados = r.lideres.filter((_, i) => checks[i]?.checked).map(l => l.nome);
  const wappEl = document.getElementById('hist-rel-wapp');
  if (wappEl) wappEl.textContent = gerarWapp(r, selecionados);
}

function excluirReg(id) {
  if (!confirm('Excluir este registro?')) return;
  DB.registros = DB.registros.filter(x => x.id !== id);
  if (histSelecionado === id) {
    histSelecionado = null;
    const rel = document.getElementById('hist-relatorio');
    if (rel) rel.style.display = 'none';
  }
  save();
  renderHistorico();
  toast('Registro excluído.');
}

function duplicarReg(id) {
  const r = DB.registros.find(x => x.id === id);
  if (!r) return;
  const novo = { ...JSON.parse(JSON.stringify(r)), id: Date.now(), data: hoje(), criadoEm: new Date().toISOString() };
  DB.registros.unshift(novo);
  save();
  renderHistorico();
  toast('Registro duplicado com data de hoje.');
}

function editarReg(id) {
  const r = DB.registros.find(x => x.id === id);
  if (!r) return;
  editandoId = id;

  const body = document.getElementById('modal-edit-body');
  if (!body) return;
  body.innerHTML = `
    <div class="form-row col2" style="margin-bottom:12px">
      <div class="form-group">
        <label class="form-label">Data</label>
        <input type="date" class="form-input" id="ed-data" value="${r.data}">
      </div>
      <div class="form-group">
        <label class="form-label">Período</label>
        <select class="form-select" id="ed-periodo">
          ${['Manhã','Tarde','Noturno'].map(p => `<option value="${p}" ${r.periodo===p?'selected':''}>${p}</option>`).join('')}
        </select>
      </div>
    </div>
    <div class="form-group">
      <label class="form-label">Origens</label>
      <div class="toggle-group" id="ed-origens">
        ${DB.origens.map(o => `<div class="toggle-btn ${(r.origens||[]).includes(o)?'on':''}" data-val="${o}" onclick="this.classList.toggle('on')">${o}</div>`).join('')}
      </div>
    </div>
    <div class="form-group">
      <label class="form-label">Líderes</label>
      <div style="display:grid;grid-template-columns:1fr 80px 28px;gap:6px;margin-bottom:6px;">
        <span class="form-label" style="margin:0">Líder</span>
        <span class="form-label" style="margin:0;text-align:center">O.S</span>
        <span></span>
      </div>
      <div id="ed-lideres"></div>
      <button class="btn btn-ghost btn-sm" onclick="addEdLider()" style="margin-top:6px">+ Líder</button>
    </div>
    <div class="form-group">
      <label class="form-label">Observação</label>
      <textarea class="form-textarea" id="ed-obs">${r.obs||''}</textarea>
    </div>
  `;

  r.lideres.forEach(l => addEdLider(l.nome, l.qtd));
  abrirModal('modal-edit');
}

function addEdLider(nome = '', qtd = '') {
  const c = document.getElementById('ed-lideres');
  if (!c) return;
  const row = document.createElement('div');
  row.className = 'lider-row-form';
  row.innerHTML = `
    <input type="text" class="form-input" value="${nome}" style="font-size:12px">
    <input type="number" class="form-input" value="${qtd}" min="0" style="text-align:center">
    <button class="btn-icon" onclick="this.parentElement.remove()">x</button>
  `;
  c.appendChild(row);
}

function salvarEdicao() {
  const r = DB.registros.find(x => x.id === editandoId);
  if (!r) return;
  r.data = document.getElementById('ed-data').value;
  r.periodo = document.getElementById('ed-periodo').value;
  r.origens = [...document.querySelectorAll('#ed-origens .toggle-btn.on')].map(b => b.dataset.val);
  r.obs = document.getElementById('ed-obs').value.trim();
  const rows = document.querySelectorAll('#ed-lideres .lider-row-form');
  r.lideres = [...rows].map(row => ({
    nome: row.querySelector('input[type=text]').value.trim(),
    qtd: parseInt(row.querySelector('input[type=number]').value) || 0
  })).filter(l => l.nome);
  r.total = calcTotal(r.lideres);
  save();
  fecharModal('modal-edit');
  renderHistorico();
  toast('Registro atualizado.');
}

// ─── RELATÓRIOS PAGE ────────────────────────────────────────

function populateRelFiltros() {
  const meses = [...new Set(DB.registros.map(r => r.data.slice(0, 7)))].sort().reverse();
  const el = document.getElementById('rel-mes');
  if (el) {
    el.innerHTML = '<option value="">Todos os meses</option>' +
      meses.map(m => `<option value="${m}">${fmtMes(m+'-01')}</option>`).join('');
  }

  const nomes = [...new Set(DB.registros.flatMap(r => r.lideres.map(l => l.nome)))].sort();
  const lEl = document.getElementById('rel-lider');
  if (lEl) {
    lEl.innerHTML = '<option value="">Todos</option>' + nomes.map(n => `<option value="${n}">${n}</option>`).join('');
  }
}

function gerarRelatorio() {
  const mes = document.getElementById('rel-mes').value;
  const periodo = document.getElementById('rel-periodo').value;
  const lider = document.getElementById('rel-lider').value;

  let regs = DB.registros.filter(r => {
    if (mes && !r.data.startsWith(mes)) return false;
    if (periodo && r.periodo !== periodo) return false;
    if (lider && !r.lideres.some(l => l.nome === lider)) return false;
    return true;
  }).sort((a, b) => a.data.localeCompare(b.data));

  if (!regs.length) { toast('Nenhum registro para os filtros selecionados.'); return; }

  const titulo = `Relatório — ${mes ? fmtMes(mes+'-01') : 'Histórico Completo'}${periodo ? ' / '+periodo : ''}${lider ? ' / '+lider : ''}`;
  document.getElementById('rel-titulo').textContent = titulo;

  let formal = `${titulo.toUpperCase()}\n${'═'.repeat(44)}\n\n`;
  let wapp = `*${titulo.toUpperCase()}*\n\n`;

  const grupos = {};
  regs.forEach(r => {
    const k = r.data.slice(0, 7);
    if (!grupos[k]) grupos[k] = [];
    grupos[k].push(r);
  });

  let totalGeral = 0;
  Object.keys(grupos).sort().forEach(k => {
    const titMes = fmtMes(k + '-01');
    formal += `[ ${titMes} ]\n\n`;
    wapp += `*[ ${titMes} ]*\n\n`;
    grupos[k].forEach(r => {
      const lideresFilt = lider ? r.lideres.filter(l => l.nome === lider) : r.lideres;
      const tot = calcTotal(lideresFilt);
      totalGeral += tot;
      formal += `Data: ${fmtData(r.data)} | Período: ${r.periodo}\n`;
      formal += `Origem: ${(r.origens||[]).join(' / ')}\n`;
      formal += `Não entregue: ${tot}\n`;
      lideresFilt.forEach(l => { formal += `  - ${l.nome}: ${l.qtd} O.S\n`; });
      if (r.obs) formal += `  Obs: ${r.obs}\n`;
      formal += '\n';

      wapp += `*${fmtData(r.data)}* — ${r.periodo}\n`;
      wapp += `_Não entregue: ${tot}_\n`;
      lideresFilt.forEach(l => { wapp += `${l.qtd} O.S — ${l.nome}\n`; });
      if (r.obs) wapp += `_Obs: ${r.obs}_\n`;
      wapp += '\n';
    });
    const totMes = grupos[k].reduce((s, r) => {
      const lf = lider ? r.lideres.filter(l => l.nome === lider) : r.lideres;
      return s + calcTotal(lf);
    }, 0);
    formal += `${'─'.repeat(44)}\nTotal ${titMes}: ${totMes} O.S\n\n`;
    wapp += `*Total ${titMes}: ${totMes} O.S*\n\n`;
  });

  formal += `${'═'.repeat(44)}\nTOTAL GERAL: ${totalGeral} O.S`;
  wapp += `*TOTAL GERAL: ${totalGeral} O.S*`;

  document.getElementById('rel-formal-text').textContent = formal;
  document.getElementById('rel-wapp-text').textContent = wapp;
  document.getElementById('rel-resultado').style.display = 'block';
  document.getElementById('rel-resultado').scrollIntoView({ behavior: 'smooth' });
}

function gerarRelatorioCompleto() {
  document.getElementById('rel-mes').value = '';
  document.getElementById('rel-periodo').value = '';
  document.getElementById('rel-lider').value = '';
  gerarRelatorio();
}

// ─── GRÁFICOS ────────────────────────────────────────────────

function populateGrafMes() {
  const meses = [...new Set(DB.registros.map(r => r.data.slice(0, 7)))].sort().reverse();
  const el = document.getElementById('graf-mes');
  if (el) {
    el.innerHTML = meses.map((m, i) => `<option value="${m}" ${i===0?'selected':''}>${fmtMes(m+'-01')}</option>`).join('');
  }
}

function renderGraficos() {
  const mes = document.getElementById('graf-mes')?.value;
  if (!mes) return;
  const regs = DB.registros.filter(r => r.data.startsWith(mes)).sort((a, b) => a.data.localeCompare(b.data));

  // Dias
  destroyChart('chart-dias');
  const diasLabels = regs.map(r => fmtData(r.data).slice(0, 5));
  const diasVals = regs.map(r => r.total);
  const canvasDias = document.getElementById('chart-dias');
  if (canvasDias) {
    charts['chart-dias'] = new Chart(canvasDias, {
      type: 'bar',
      data: { labels: diasLabels, datasets: [{ data: diasVals, backgroundColor: '#d63031', borderRadius: 2 }] },
      options: chartOpts()
    });
  }

  // Líderes
  destroyChart('chart-lider-mes');
  const liderMapa = {};
  regs.forEach(r => r.lideres.forEach(l => { liderMapa[l.nome] = (liderMapa[l.nome]||0) + l.qtd; }));
  const liderEntries = Object.entries(liderMapa).sort((a,b)=>b[1]-a[1]);
  const cores = ['#d63031','#e17055','#fdcb6e','#0984e3','#6c5ce7','#00b894','#fd79a8','#a29bfe'];
  const canvasLider = document.getElementById('chart-lider-mes');
  if (canvasLider) {
    charts['chart-lider-mes'] = new Chart(canvasLider, {
      type: 'doughnut',
      data: {
        labels: liderEntries.map(e => e[0]),
        datasets: [{ data: liderEntries.map(e => e[1]), backgroundColor: cores.slice(0, liderEntries.length), borderWidth: 0 }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: { legend: { labels: { color: '#9090a8', font: { size: 10 }, boxWidth: 12 } } }
      }
    });
  }

  // Mensal
  destroyChart('chart-mensal');
  const todosOsMeses = [...new Set(DB.registros.map(r => r.data.slice(0, 7)))].sort().slice(-6);
  const mensalVals = todosOsMeses.map(m => DB.registros.filter(r=>r.data.startsWith(m)).reduce((s,r)=>s+r.total,0));
  const canvasMensal = document.getElementById('chart-mensal');
  if (canvasMensal) {
    charts['chart-mensal'] = new Chart(canvasMensal, {
      type: 'line',
      data: {
        labels: todosOsMeses.map(m => fmtMes(m+'-01').slice(0,3)),
        datasets: [{ data: mensalVals, borderColor: '#d63031', backgroundColor: 'rgba(214,48,49,0.08)', borderWidth: 2, fill: true, tension: 0.4, pointBackgroundColor: '#d63031' }]
      },
      options: chartOpts()
    });
  }

  // Período
  destroyChart('chart-periodo2');
  const periodos = ['Manhã', 'Tarde', 'Noturno'];
  const pVals = periodos.map(p => regs.filter(r => r.periodo === p).reduce((s, r) => s + r.total, 0));
  const canvasPeriodo = document.getElementById('chart-periodo2');
  if (canvasPeriodo) {
    charts['chart-periodo2'] = new Chart(canvasPeriodo, {
      type: 'bar',
      data: {
        labels: periodos,
        datasets: [{ data: pVals, backgroundColor: ['#d63031','#e17055','#0984e3'], borderRadius: 2 }]
      },
      options: chartOpts()
    });
  }
}

// ─── RANKING ──────────────────────────────────────────────────

function populateRankFiltros() {
  const meses = [...new Set(DB.registros.map(r => r.data.slice(0, 7)))].sort().reverse();
  const el = document.getElementById('rank-mes');
  if (el) {
    el.innerHTML = '<option value="">Histórico completo</option>' +
      meses.map(m => `<option value="${m}">${fmtMes(m+'-01')}</option>`).join('');
  }
}

function renderRanking() {
  const mes = document.getElementById('rank-mes')?.value || '';
  const turno = document.getElementById('rank-turno')?.value || '';

  let regs = DB.registros.filter(r => {
    if (mes && !r.data.startsWith(mes)) return false;
    if (turno && r.periodo !== turno) return false;
    return true;
  });

  const mapa = {};
  regs.forEach(r => r.lideres.forEach(l => {
    if (!mapa[l.nome]) mapa[l.nome] = { total: 0, dias: 0, pior: 0 };
    mapa[l.nome].total += l.qtd;
    mapa[l.nome].dias += 1;
    if (l.qtd > mapa[l.nome].pior) mapa[l.nome].pior = l.qtd;
  }));

  const sorted = Object.entries(mapa).sort((a, b) => b[1].total - a[1].total);
  const max = sorted[0]?.[1].total || 1;

  const rl = document.getElementById('rank-lista');
  if (rl) {
    if (!sorted.length) {
      rl.innerHTML = '<p style="font-size:11px;color:var(--text3)">Sem dados.</p>';
    } else {
      rl.innerHTML = sorted.map(([nome, d], i) => `
        <div class="ranking-item">
          <span class="ranking-pos">${i+1}</span>
          <div style="flex:1">
            <div style="font-size:12px;color:var(--text);margin-bottom:3px">${nome}</div>
            <div class="progress-bar"><div class="progress-fill ${i===0?'':'amber'}" style="width:${Math.round(d.total/max*100)}%"></div></div>
          </div>
          <span class="ranking-val">${d.total}</span>
        </div>
      `).join('');
    }
  }

  const tbody = document.getElementById('rank-table-body');
  if (tbody) {
    tbody.innerHTML = sorted.map(([nome, d]) => `
      <tr>
        <td>${nome}</td>
        <td class="td-num" style="color:var(--red)">${d.total}</td>
        <td class="td-mono">${d.dias}</td>
        <td class="td-mono">${d.dias > 0 ? (d.total/d.dias).toFixed(1) : '—'}</td>
        <td class="td-num">${d.pior}</td>
      </tr>
    `).join('');
  }
}

// ─── LÍDERES CAD ─────────────────────────────────────────────

function renderLideresCad() {
  const el = document.getElementById('lideres-lista-cad');
  if (!el) return;
  if (!DB.lideres.length) {
    el.innerHTML = '<p style="font-size:11px;color:var(--text3)">Nenhum líder cadastrado.</p>';
    return;
  }
  el.innerHTML = `<div class="table-wrap"><table>
    <thead><tr><th>Nome</th><th>Turno</th><th></th></tr></thead>
    <tbody>${DB.lideres.map(l => `
      <tr>
        <td>${l.nome}</td>
        <td><span class="tag tag-blue">${l.turno}</span></td>
        <td><div class="td-actions">
          <button class="btn btn-danger btn-sm" onclick="excluirLider(${l.id})">Remover</button>
        </div></td>
      </tr>
    `).join('')}</tbody>
  </table></div>`;
}

function salvarLider() {
  const nome = document.getElementById('cad-lider-nome').value.trim();
  const turno = document.getElementById('cad-lider-turno').value;
  if (!nome) { toast('Informe o nome.'); return; }
  if (DB.lideres.find(l => l.nome.toLowerCase() === nome.toLowerCase())) { toast('Líder já cadastrado.'); return; }
  DB.lideres.push({ id: Date.now(), nome, turno });
  save();
  document.getElementById('cad-lider-nome').value = '';
  renderLideresCad();
  toast('Líder adicionado.');
}

function excluirLider(id) {
  if (!confirm('Remover este líder?')) return;
  DB.lideres = DB.lideres.filter(l => l.id !== id);
  save();
  renderLideresCad();
  toast('Líder removido.');
}

// ─── ORIGENS CAD ─────────────────────────────────────────────

function renderOrigensCad() {
  const el = document.getElementById('origens-lista-cad');
  if (!el) return;
  el.innerHTML = `<div class="table-wrap"><table>
    <thead><tr><th>Origem</th><th></th></tr></thead>
    <tbody>${DB.origens.map(o => `
      <tr>
        <td><span class="tag tag-amber">${o}</span></td>
        <td><div class="td-actions">
          <button class="btn btn-danger btn-sm" onclick="excluirOrigem('${o.replace(/'/g,"\\'")}')">Remover</button>
        </div></td>
      </tr>
    `).join('')}</tbody>
  </table></div>`;
}

function salvarOrigem() {
  const nome = document.getElementById('cad-origem-nome').value.trim();
  if (!nome) { toast('Informe o nome da origem.'); return; }
  if (DB.origens.includes(nome)) { toast('Origem já existe.'); return; }
  DB.origens.push(nome);
  save();
  document.getElementById('cad-origem-nome').value = '';
  renderOrigensCad();
  buildOrigensBtns();
  toast('Origem adicionada.');
}

function excluirOrigem(nome) {
  if (!confirm('Remover esta origem?')) return;
  DB.origens = DB.origens.filter(o => o !== nome);
  save();
  renderOrigensCad();
  buildOrigensBtns();
  toast('Origem removida.');
}

// ─── DADOS ────────────────────────────────────────────────────

function renderDadosResumo() {
  const el = document.getElementById('dados-resumo');
  if (!el) return;
  const totalOS = DB.registros.reduce((s, r) => s + r.total, 0);
  const meses = new Set(DB.registros.map(r => r.data.slice(0, 7))).size;
  el.innerHTML = `
    <div class="grid-4">
      <div class="stat-card red"><div class="label">Registros</div><div class="value">${DB.registros.length}</div></div>
      <div class="stat-card amber"><div class="label">Total O.S</div><div class="value amber">${totalOS}</div></div>
      <div class="stat-card blue"><div class="label">Líderes</div><div class="value">${DB.lideres.length}</div></div>
      <div class="stat-card green"><div class="label">Meses</div><div class="value">${meses}</div></div>
    </div>
  `;
}

function exportJSON() {
  const blob = new Blob([JSON.stringify(DB, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `scp_backup_${hoje()}.json`;
  a.click();
  URL.revokeObjectURL(url);
  toast('JSON exportado.');
}

function exportCSV() {
  const rows = [['Data','Período','Tipo','Origens','Líder','Qtd O.S','Obs']];
  DB.registros.forEach(r => {
    r.lideres.forEach(l => {
      rows.push([fmtData(r.data), r.periodo, r.tipo||'Corretiva', (r.origens||[]).join(';'), l.nome, l.qtd, r.obs||'']);
    });
  });
  const csv = rows.map(r => r.map(c => `"${String(c).replace(/"/g,'""')}"`).join(',')).join('\n');
  const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `scp_dados_${hoje()}.csv`;
  a.click();
  URL.revokeObjectURL(url);
  toast('CSV exportado.');
}

function exportRelPDF() {
  let txt = 'RELATÓRIO COMPLETO — PENDÊNCIAS O.S\n' + '='.repeat(44) + '\n\n';
  const grupos = {};
  DB.registros.sort((a,b)=>a.data.localeCompare(b.data)).forEach(r => {
    const k = r.data.slice(0,7);
    if (!grupos[k]) grupos[k] = [];
    grupos[k].push(r);
  });
  Object.keys(grupos).sort().forEach(k => {
    txt += `[ ${fmtMes(k+'-01')} ]\n\n`;
    grupos[k].forEach(r => {
      txt += `Data: ${fmtData(r.data)} | ${r.periodo}\n`;
      txt += `Origem: ${(r.origens||[]).join(' / ')}\n`;
      txt += `Não entregue: ${r.total}\n`;
      r.lideres.forEach(l => { txt += `  - ${l.nome}: ${l.qtd}\n`; });
      if (r.obs) txt += `  Obs: ${r.obs}\n`;
      txt += '\n';
    });
    txt += '-'.repeat(44) + '\n\n';
  });
  txt += 'TOTAL GERAL: ' + DB.registros.reduce((s,r)=>s+r.total,0) + ' O.S';
  const blob = new Blob([txt], { type: 'text/plain;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `scp_relatorio_${hoje()}.txt`;
  a.click();
  URL.revokeObjectURL(url);
  toast('Relatório TXT exportado.');
}

function importJSON(event) {
  const file = event.target.files[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = e => {
    try {
      const d = JSON.parse(e.target.result);
      if (!d.registros) throw new Error('Formato inválido');
      DB = d;
      save();
      navTo('dashboard');
      toast(`${d.registros.length} registros importados.`);
    } catch {
      toast('Arquivo inválido.');
    }
  };
  reader.readAsText(file);
  event.target.value = '';
}

function imprimirRelatorio() {
  window.print();
}