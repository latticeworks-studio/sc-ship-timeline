'use strict';

const MFR_CLASS = {
  'Roberts Space Industries': 'RSI',
  'Anvil Aerospace':          'Anvil',
  'Aegis Dynamics':           'Aegis',
  'Drake Interplanetary':     'Drake',
  'MISC':                     'MISC',
  'Origin Jumpworks':         'Origin',
  'Crusader Industries':      'Crusader',
  'Banu':                     'Banu',
  'Gatac Manufacture':        'Gatac',
  'Esperia':                  'Esperia',
  'Mirai':                    'Mirai',
  'Greycat Industrial':       'Greycat',
  'Tumbril Land Systems':     'Tumbril',
  'Argo Astronautics':        'Argo',
  'Consolidated Outland':     'CO',
  "Xi'An":                    'XiAn',
};

let allShips = [];
let filteredShips = [];
let currentSort = 'name';
let currentSearch = '';
let currentPatch = '';
let currentStatus = '';
let selectedId = null;

// ─── Init ──────────────────────────────────────────────────────────────────
async function init() {
  try {
    const res = await fetch('data/ships.json');
    allShips = await res.json();
    populatePatchDropdown();
    applyFilters();
    setupSearch();
    setupSort();
    setupPatchFilter();
    setupStatusFilter();
    initStatsModal();
  } catch (err) {
    document.getElementById('ship-list').innerHTML =
      `<div class="empty-state"><p>Failed to load ship data.</p><p style="font-size:11px;margin-top:4px">${err.message}</p></div>`;
  }
}

// ─── Filter + sort ─────────────────────────────────────────────────────────
function applyFilters() {
  const q = currentSearch.toLowerCase().trim();

  filteredShips = allShips.filter(s => {
    if (q && !(
      s.name.toLowerCase().includes(q) ||
      s.manufacturer.toLowerCase().includes(q) ||
      s.manufacturer_short.toLowerCase().includes(q)
    )) return false;
    if (currentPatch && s.flyable_patch !== currentPatch) return false;
    if (currentStatus && s.status !== currentStatus) return false;
    return true;
  });

  filteredShips = sortShips(filteredShips, currentSort);
  renderList();
  updateStats();
}

function sortShips(ships, by) {
  return [...ships].sort((a, b) => {
    switch (by) {
      case 'name':
        return a.name.localeCompare(b.name);
      case 'manufacturer':
        return a.manufacturer.localeCompare(b.manufacturer) || a.name.localeCompare(b.name);
      case 'announced':
        return dateVal(a.announced) - dateVal(b.announced) || a.name.localeCompare(b.name);
      case 'flyable':
        return dateVal(a.flyable_date) - dateVal(b.flyable_date) || a.name.localeCompare(b.name);
      default:
        return 0;
    }
  });
}

function dateVal(d) {
  if (!d) return Infinity;
  return new Date(d).getTime();
}

// ─── Render list ───────────────────────────────────────────────────────────
function renderList() {
  const list = document.getElementById('ship-list');

  if (filteredShips.length === 0) {
    list.innerHTML = `<div class="empty-state"><p>No ships match your search.</p></div>`;
    return;
  }

  const byGroup = currentSort === 'manufacturer'
    ? groupByManufacturer(filteredShips)
    : [{ label: null, ships: filteredShips }];

  let html = '';
  for (const group of byGroup) {
    if (group.label) {
      html += `<div class="group-header">${escHtml(group.label)}</div>`;
    }
    for (const ship of group.ships) {
      html += renderListItem(ship);
    }
  }

  list.innerHTML = html;

  list.querySelectorAll('.ship-item').forEach(el => {
    el.addEventListener('click', () => selectShip(el.dataset.id));
    el.addEventListener('keydown', e => {
      if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); selectShip(el.dataset.id); }
    });
  });

  if (selectedId) reopenSelected();
}

function groupByManufacturer(ships) {
  const map = new Map();
  for (const ship of ships) {
    if (!map.has(ship.manufacturer)) map.set(ship.manufacturer, []);
    map.get(ship.manufacturer).push(ship);
  }
  return [...map.entries()].sort((a, b) => a[0].localeCompare(b[0]))
    .map(([label, ships]) => ({ label, ships }));
}

function renderListItem(ship) {
  const dotClass = ship.status === 'flyable' ? 'dot-flyable' : 'dot-unreleased';
  const patch = ship.flyable_patch
    ? escHtml(shortPatch(ship.flyable_patch))
    : `<span style="color:var(--gray);font-style:italic">Unreleased</span>`;
  const statusBadgeSmall = ship.status === 'flyable'
    ? `<span class="status-badge badge-flyable">Flyable</span>`
    : `<span class="status-badge badge-unreleased">Unreleased</span>`;
  const chevron = `<svg width="14" height="14" viewBox="0 0 14 14" fill="none"><path d="M3 5l4 4 4-4" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/></svg>`;

  return `
    <div class="ship-row-wrap">
      <div class="ship-item" data-id="${ship.id}" role="button" tabindex="0">
        <span class="ship-status-dot ${dotClass}"></span>
        <span class="ship-item-name">${escHtml(ship.name)}</span>
        <span class="ship-item-mfr">${escHtml(ship.manufacturer)}</span>
        <span class="ship-item-patch">${patch}</span>
        <span class="ship-item-status">${statusBadgeSmall}</span>
        <span class="ship-item-chevron">${chevron}</span>
      </div>
      <div class="ship-expand" id="expand-${ship.id}">
        <div class="ship-expand-inner">
          <div class="ship-expand-content" id="expand-content-${ship.id}"></div>
        </div>
      </div>
    </div>`;
}

function shortPatch(p) {
  return p.replace('Arena Commander ', 'AC ').replace('Alpha ', '');
}

// ─── Select ship (accordion) ───────────────────────────────────────────────
function selectShip(id) {
  if (selectedId === id) {
    // collapse (toggle off)
    collapseRow(id);
    selectedId = null;
    return;
  }

  if (selectedId) collapseRow(selectedId);

  selectedId = id;

  const itemEl   = document.querySelector(`.ship-item[data-id="${id}"]`);
  const expandEl = document.getElementById(`expand-${id}`);
  const contentEl = document.getElementById(`expand-content-${id}`);

  if (!itemEl || !expandEl) return;

  // lazy-render detail on first open
  if (!contentEl.dataset.rendered) {
    const ship = allShips.find(s => s.id === id);
    if (ship) contentEl.innerHTML = buildDetailHTML(ship);
    contentEl.dataset.rendered = 'true';
  }

  itemEl.classList.add('selected');
  expandEl.classList.add('open');

  // scroll item into view if needed
  setTimeout(() => itemEl.scrollIntoView({ block: 'nearest', behavior: 'smooth' }), 50);
}

function collapseRow(id) {
  const itemEl   = document.querySelector(`.ship-item[data-id="${id}"]`);
  const expandEl = document.getElementById(`expand-${id}`);
  if (itemEl)   itemEl.classList.remove('selected');
  if (expandEl) expandEl.classList.remove('open');
}

function reopenSelected() {
  const itemEl   = document.querySelector(`.ship-item[data-id="${selectedId}"]`);
  const expandEl = document.getElementById(`expand-${selectedId}`);
  const contentEl = document.getElementById(`expand-content-${selectedId}`);
  if (!itemEl) return;
  if (!contentEl.dataset.rendered) {
    const ship = allShips.find(s => s.id === selectedId);
    if (ship) contentEl.innerHTML = buildDetailHTML(ship);
    contentEl.dataset.rendered = 'true';
  }
  itemEl.classList.add('selected');
  expandEl.classList.add('open');
}

// ─── Detail HTML ───────────────────────────────────────────────────────────
function buildDetailHTML(ship) {
  const mfrClass = 'mfr-' + (MFR_CLASS[ship.manufacturer] || 'RSI');
  const statusBadge = ship.status === 'flyable'
    ? `<span class="status-badge badge-flyable">Flyable</span>`
    : `<span class="status-badge badge-unreleased">Unreleased</span>`;

  const announcedRow = buildDateRow('Announced', ship.announced, ship.announced_uncertain, null);
  const flyableRow   = ship.status === 'flyable'
    ? buildDateRow('Flyable', ship.flyable_date, ship.flyable_uncertain, ship.flyable_patch)
    : buildUnreleasedRow('Flyable');

  let deltaRow = '';
  if (ship.status === 'flyable' && ship.announced && ship.flyable_date) {
    const delta = calcDelta(ship.announced, ship.flyable_date);
    if (delta) {
      const approx = ship.announced_uncertain || ship.flyable_uncertain;
      deltaRow = `<div class="timeline-row timeline-row-delta">
        <div class="timeline-row-label">Duration</div>
        <div class="timeline-row-value">
          <div class="timeline-delta">
            ${approx ? '<span class="uncertain-mark" title="Based on estimated dates">~</span>' : ''}
            ${delta}
          </div>
          <div class="timeline-delta-sub">Announced → Flyable</div>
        </div>
      </div>`;
    }
  } else if (ship.status === 'unreleased' && ship.announced) {
    const today = new Date().toISOString().slice(0, 10);
    const delta = calcDelta(ship.announced, today);
    if (delta) {
      const approx = ship.announced_uncertain;
      deltaRow = `<div class="timeline-row timeline-row-delta timeline-row-waiting">
        <div class="timeline-row-label">Waiting</div>
        <div class="timeline-row-value">
          <div class="timeline-delta waiting">
            ${approx ? '<span class="uncertain-mark" title="Based on estimated announced date">~</span>' : ''}
            ${delta}
          </div>
          <div class="timeline-delta-sub">Since announced — still waiting</div>
        </div>
      </div>`;
    }
  }

  const uncertainNote = (ship.announced_uncertain || ship.flyable_uncertain)
    ? `<div class="detail-note">
        <span class="detail-note-icon">⚠</span>
        <span>Dates marked <strong style="color:var(--amber)">~</strong> are approximate and sourced from community records. Verify against the <a href="https://starcitizen.tools/Patch_notes" target="_blank" rel="noopener">SC Wiki patch notes</a>.</span>
      </div>`
    : '';

  return `
    <div class="detail-card">
      <div class="detail-header">
        <div class="detail-status-row">
          ${statusBadge}
          <span class="mfr-badge ${mfrClass}">${escHtml(ship.manufacturer_short)}</span>
        </div>
        <h2 class="detail-name">${escHtml(ship.name)}</h2>
        <p class="detail-mfr-full">${escHtml(ship.manufacturer)}</p>
      </div>
      <div class="timeline-card">
        <div class="timeline-title">Timeline</div>
        ${announcedRow}
        ${flyableRow}
        ${deltaRow}
      </div>
      ${uncertainNote}
    </div>`;
}

function buildDateRow(label, date, uncertain, patch) {
  const formatted = date ? formatDate(date, uncertain) : null;
  const dateHtml = formatted
    ? `<div class="timeline-date">${formatted}</div>`
    : `<div class="timeline-unreleased">Unknown</div>`;

  const patchHtml = patch
    ? `<div><span class="timeline-patch">${escHtml(patch)}</span></div>`
    : '';

  return `
    <div class="timeline-row">
      <div class="timeline-row-label">${label}</div>
      <div class="timeline-row-value">
        ${dateHtml}
        ${patchHtml}
      </div>
    </div>`;
}

function buildUnreleasedRow(label) {
  return `
    <div class="timeline-row">
      <div class="timeline-row-label">${label}</div>
      <div class="timeline-row-value">
        <div class="timeline-unreleased">Not yet released</div>
      </div>
    </div>`;
}

function calcDelta(announcedStr, flyableStr) {
  if (!announcedStr || !flyableStr) return null;
  const a = new Date(announcedStr + 'T00:00:00');
  const b = new Date(flyableStr  + 'T00:00:00');
  if (b <= a) return null;

  let years  = b.getFullYear() - a.getFullYear();
  let months = b.getMonth()    - a.getMonth();
  if (months < 0) { years--; months += 12; }

  const parts = [];
  if (years  > 0) parts.push(`${years} year${years   !== 1 ? 's' : ''}`);
  if (months > 0) parts.push(`${months} month${months !== 1 ? 's' : ''}`);
  return parts.length ? parts.join(', ') : 'Less than a month';
}

function formatDate(dateStr, uncertain) {
  const d = new Date(dateStr + 'T00:00:00');
  const month = d.toLocaleString('en-US', { month: 'long' });
  const year = d.getFullYear();
  const day = d.getDate();
  const tilde = uncertain
    ? `<span class="uncertain-mark" title="Approximate date">~</span>`
    : '';
  return `${tilde}${month} ${day}, ${year}`;
}

// ─── Stats bar ─────────────────────────────────────────────────────────────
function updateStats() {
  const total     = filteredShips.length;
  const flyable   = filteredShips.filter(s => s.status === 'flyable').length;
  const unreleased = filteredShips.filter(s => s.status === 'unreleased').length;

  const countStr = `${total} ship${total !== 1 ? 's' : ''}`;
  const parts = [];
  if (currentPatch)  parts.push(currentPatch);
  if (currentSearch) parts.push(`"${currentSearch}"`);
  parts.push(countStr);
  if (!currentPatch) parts.push(`${flyable} flyable`, `${unreleased} unreleased`);

  document.getElementById('stats-text').textContent = parts.join('  ·  ');
}

// ─── Patch dropdown ────────────────────────────────────────────────────────
function getOrderedPatches() {
  // For each unique patch, track the earliest flyable_date so we can sort
  // chronologically without parsing version strings.
  const patchDate = new Map();
  for (const ship of allShips) {
    if (!ship.flyable_patch || !ship.flyable_date) continue;
    const existing = patchDate.get(ship.flyable_patch);
    if (!existing || ship.flyable_date < existing) {
      patchDate.set(ship.flyable_patch, ship.flyable_date);
    }
  }
  return [...patchDate.entries()]
    .sort((a, b) => a[1].localeCompare(b[1]))
    .map(([patch]) => patch);
}

function populatePatchDropdown() {
  const select = document.getElementById('patch-filter');
  const patches = getOrderedPatches();
  select.innerHTML =
    '<option value="">All patches</option>' +
    patches.map(p => `<option value="${escHtml(p)}">${escHtml(p)}</option>`).join('');
}

function setupPatchFilter() {
  const select = document.getElementById('patch-filter');
  select.addEventListener('change', () => {
    currentPatch = select.value;
    select.classList.toggle('active', !!currentPatch);
    selectedId = null; // collapse any open card when filter changes
    applyFilters();
  });
}

// ─── Search ────────────────────────────────────────────────────────────────
function setupSearch() {
  const input = document.getElementById('search');
  const clear = document.getElementById('search-clear');
  const wrap = input.closest('.search-wrap');

  input.addEventListener('input', () => {
    currentSearch = input.value;
    wrap.classList.toggle('has-value', !!currentSearch);
    applyFilters();
  });

  clear.addEventListener('click', () => {
    input.value = '';
    currentSearch = '';
    wrap.classList.remove('has-value');
    input.focus();
    applyFilters();
  });

  input.addEventListener('keydown', e => {
    if (e.key === 'Escape') clear.click();
  });
}

// ─── Sort ──────────────────────────────────────────────────────────────────
function setupSort() {
  document.querySelectorAll('.sort-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.sort-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      currentSort = btn.dataset.sort;
      applyFilters();
    });
  });
}

// ─── Helpers ───────────────────────────────────────────────────────────────
function escHtml(str) {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

// ─── Status filter ─────────────────────────────────────────────────────────
function setupStatusFilter() {
  document.querySelectorAll('.status-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      currentStatus = btn.dataset.status;
      document.querySelectorAll('.status-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      selectedId = null;
      applyFilters();
    });
  });
}

// ─── Stats modal ───────────────────────────────────────────────────────────
function initStatsModal() {
  const modal    = document.getElementById('stats-modal');
  const closeBtn = document.getElementById('stats-modal-close');
  const openBtn  = document.getElementById('stats-open-btn');
  if (!modal) return;

  const open = () => {
    document.getElementById('stats-modal-content').innerHTML = buildStatsHTML();
    modal.classList.add('open');
  };
  const close = () => modal.classList.remove('open');

  openBtn?.addEventListener('click', open);
  closeBtn.addEventListener('click', close);
  modal.addEventListener('click', e => { if (e.target === modal) close(); });
}

function buildStatsHTML() {
  const ships = allShips;

  // ── Per year ──
  const ann = {}, fly = {};
  ships.forEach(s => {
    if (s.announced)    { const y = s.announced.slice(0,4);    ann[y] = (ann[y] || 0) + 1; }
    if (s.flyable_date) { const y = s.flyable_date.slice(0,4); fly[y] = (fly[y] || 0) + 1; }
  });
  const allYears = [...new Set([...Object.keys(ann), ...Object.keys(fly)])].sort();
  const maxYr = Math.max(...allYears.map(y => Math.max(ann[y] || 0, fly[y] || 0)), 1);

  // ── Per manufacturer ──
  const mfr = {};
  ships.forEach(s => { mfr[s.manufacturer_short] = (mfr[s.manufacturer_short] || 0) + 1; });
  const mfrSorted = Object.entries(mfr).sort((a, b) => b[1] - a[1]);
  const maxMfr = mfrSorted[0]?.[1] || 1;

  // ── Average announced → flyable ──
  let totalDays = 0, dCount = 0;
  ships.forEach(s => {
    if (s.announced && s.flyable_date) {
      const d = (new Date(s.flyable_date) - new Date(s.announced)) / 86400000;
      if (d > 0) { totalDays += d; dCount++; }
    }
  });
  const avgDays = dCount ? Math.round(totalDays / dCount) : 0;
  const avgYrs  = Math.floor(avgDays / 365);
  const avgMths = Math.round((avgDays % 365) / 30);

  // ── Totals ──
  const total         = ships.length;
  const flyableCount  = ships.filter(s => s.status === 'flyable').length;
  const unrelCount    = ships.filter(s => s.status === 'unreleased').length;

  // ── Year rows ──
  let yearRows = '';
  for (const y of allYears) {
    const a = ann[y] || 0, f = fly[y] || 0;
    const ap = ((a / maxYr) * 100).toFixed(1);
    const fp = ((f / maxYr) * 100).toFixed(1);
    yearRows += `
      <div class="sc-yr-row">
        <span class="sc-yr-label">${y}</span>
        <div class="sc-yr-bars">
          <div class="sc-bar-wrap">
            <div class="sc-bar sc-bar-ann" style="width:${a ? ap : 0}%"></div>
            ${a ? `<span class="sc-bar-val">${a}</span>` : '<span class="sc-bar-val" style="opacity:0.3">—</span>'}
          </div>
          <div class="sc-bar-wrap">
            <div class="sc-bar sc-bar-fly" style="width:${f ? fp : 0}%"></div>
            ${f ? `<span class="sc-bar-val">${f}</span>` : '<span class="sc-bar-val" style="opacity:0.3">—</span>'}
          </div>
        </div>
      </div>`;
  }

  // ── Manufacturer rows ──
  let mfrRows = '';
  for (const [label, count] of mfrSorted) {
    const pct = ((count / maxMfr) * 100).toFixed(1);
    mfrRows += `
      <div class="sc-mfr-row">
        <span class="sc-mfr-label">${escHtml(label)}</span>
        <div class="sc-bar-wrap sc-bar-wrap-mfr">
          <div class="sc-bar sc-bar-mfr" style="width:${pct}%"></div>
          <span class="sc-bar-val">${count}</span>
        </div>
      </div>`;
  }

  return `
    <div class="sc-summary">
      <div class="sc-stat-big"><div class="sc-stat-num">${total}</div><div class="sc-stat-lbl">Ships</div></div>
      <div class="sc-stat-big"><div class="sc-stat-num green">${flyableCount}</div><div class="sc-stat-lbl">Flyable</div></div>
      <div class="sc-stat-big"><div class="sc-stat-num amber">${unrelCount}</div><div class="sc-stat-lbl">Unreleased</div></div>
      <div class="sc-stat-big"><div class="sc-stat-num accent">${avgYrs}y ${avgMths}m</div><div class="sc-stat-lbl">Avg. wait</div></div>
    </div>

    <div class="sc-section-title">Ships per Year
      <span class="sc-legend">
        <span class="sc-leg-dot accent"></span>Announced
        <span class="sc-leg-dot green"></span>Flyable
      </span>
    </div>
    <div class="sc-year-chart">${yearRows}</div>

    <div class="sc-section-title">Ships per Manufacturer</div>
    <div class="sc-mfr-chart">${mfrRows}</div>`;
}

// ─── Community modal ───────────────────────────────────────────────────────
function initModal() {
  const modal   = document.getElementById('community-modal');
  const closeBtn = document.getElementById('modal-close');
  const dismissBtn = document.getElementById('modal-dismiss');
  const contributeBtn = document.getElementById('contribute-btn');
  if (!modal) return;

  const close = () => {
    modal.classList.remove('open');
    localStorage.setItem('sc-welcomed', '1');
  };

  closeBtn.addEventListener('click', close);
  dismissBtn.addEventListener('click', close);
  modal.addEventListener('click', e => { if (e.target === modal) close(); });
  contributeBtn?.addEventListener('click', () => modal.classList.add('open'));

  // Show automatically on first visit
  if (!localStorage.getItem('sc-welcomed')) modal.classList.add('open');
}

initModal();
init();
