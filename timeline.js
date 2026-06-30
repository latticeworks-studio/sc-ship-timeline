'use strict';

const ERA_MAP = {
  'Arena Commander': 'era-ac',
  'Alpha 2.x':       'era-a2',
  'Alpha 3.x':       'era-a3',
  'Alpha 4.x':       'era-a4',
};

// ─── Init ──────────────────────────────────────────────────────────────────
async function init() {
  try {
    const res  = await fetch('data/ships.json');
    const ships = await res.json();
    const flyable    = ships.filter(s => s.status === 'flyable' && s.flyable_patch && s.flyable_date);
    const unreleased = ships.filter(s => s.status === 'unreleased' && s.announced);

    const patches = getOrderedPatches(flyable);
    renderTimeline(patches, flyable, unreleased);
  setupDrag();
  } catch (err) {
    document.getElementById('tl-track').innerHTML =
      `<div class="loading-state"><p>Failed to load data: ${escHtml(err.message)}</p></div>`;
  }
}

// ─── Patch helpers ──────────────────────────────────────────────────────────
function getEra(patch) {
  if (patch.startsWith('Arena Commander')) return 'Arena Commander';
  const m = patch.match(/Alpha (\d+)\./);
  return m ? `Alpha ${m[1]}.x` : 'Other';
}

function getOrderedPatches(ships) {
  const map = new Map();
  for (const s of ships) {
    const existing = map.get(s.flyable_patch);
    if (!existing || s.flyable_date < existing) map.set(s.flyable_patch, s.flyable_date);
  }
  return [...map.entries()]
    .sort((a, b) => a[1].localeCompare(b[1]))
    .map(([patch, date]) => ({ patch, date }));
}

function shortPatch(p) {
  return p.replace('Arena Commander ', 'AC ').replace('Alpha ', 'α');
}

// ─── Render ─────────────────────────────────────────────────────────────────
function renderTimeline(patches, flyable, unreleased) {
  const track = document.getElementById('tl-track');
  let html = '';
  let prevEra = null;

  for (let i = 0; i < patches.length; i++) {
    const { patch, date } = patches[i];
    const era      = getEra(patch);
    const eraClass = ERA_MAP[era] || '';
    const isFirst  = i === 0;
    const isLast   = i === patches.length - 1;
    const eraStart = era !== prevEra;

    // Gap element between eras
    if (eraStart && !isFirst) {
      html += `
        <div class="tl-era-gap">
          <div class="tl-era-slot"></div>
          <div class="tl-gap-info"></div>
          <div class="tl-gap-line"></div>
        </div>`;
    }

    const patchShips = flyable.filter(s => s.flyable_patch === patch);

    html += `
      <div class="tl-patch-col ${eraClass}${eraStart ? ' era-start' : ''}">
        <div class="tl-era-slot"><span class="tl-era-pill">${escHtml(era)}</span></div>
        <div class="tl-patch-name">${escHtml(shortPatch(patch))}</div>
        <div class="tl-patch-date">${fmtMonthYear(date)}</div>
        <div class="tl-line-row">
          <div class="tl-line${isFirst ? ' fade-l' : ''}"></div>
          <div class="tl-dot"></div>
          <div class="tl-line${isLast ? ' fade-r' : ''}"></div>
        </div>
        <div class="tl-connector"></div>
        <div class="tl-ships">
          ${patchShips.map(s => chipHTML(s, false)).join('')}
        </div>
      </div>`;

    prevEra = era;
  }

  // Unreleased zone at the far right
  if (unreleased.length) {
    const sorted = [...unreleased].sort((a, b) => {
      if (!a.announced) return 1;
      if (!b.announced) return -1;
      return a.announced.localeCompare(b.announced);
    });
    html += `
      <div class="tl-unreleased-col">
        <div class="tl-era-slot"><span class="tl-era-pill">Announced · Waiting</span></div>
        <div class="tl-unreleased-desc">Announced but not yet flyable</div>
        <div class="tl-unreleased-line-row">
          <div class="tl-unreleased-left"></div>
          <div class="tl-unreleased-dot"></div>
          <div class="tl-unreleased-right"></div>
        </div>
        <div class="tl-connector" style="background:rgba(255,183,77,0.25)"></div>
        <div class="tl-ships" style="margin-top:2px">
          ${sorted.map(s => chipHTML(s, true)).join('')}
        </div>
      </div>`;
  }

  track.innerHTML = html;

  // Ship chip click handlers
  track.querySelectorAll('.tl-chip').forEach(chip => {
    chip.addEventListener('click', e => {
      if (isDragging) return;
      e.stopPropagation();
      const ship = [...flyable, ...unreleased].find(s => s.id === chip.dataset.id);
      if (ship) selectChip(chip, ship);
    });
  });

  // Close on outside click
  document.addEventListener('click', closeInfoBar);
  document.getElementById('tl-info-close').addEventListener('click', e => {
    e.stopPropagation();
    closeInfoBar();
  });
}

function chipHTML(ship, isWaiting) {
  return `
    <div class="tl-chip${isWaiting ? ' waiting' : ''}" data-id="${ship.id}" title="${escHtml(ship.name)}">
      <span class="tl-chip-dot"></span>
      <span class="tl-chip-name">${escHtml(ship.name)}</span>
    </div>`;
}

// ─── Drag to scroll ─────────────────────────────────────────────────────────
let isDragging = false;

function setupDrag() {
  const el = document.querySelector('.tl-scroll-outer');
  let isDown = false;
  let startX, startScrollLeft;

  el.addEventListener('mousedown', e => {
    if (e.button !== 0) return;
    isDown = true;
    isDragging = false;
    startX = e.pageX;
    startScrollLeft = el.scrollLeft;
    el.classList.add('dragging');
  });

  window.addEventListener('mousemove', e => {
    if (!isDown) return;
    const delta = e.pageX - startX;
    if (Math.abs(delta) > 4) isDragging = true;
    el.scrollLeft = startScrollLeft - delta;
  });

  window.addEventListener('mouseup', () => {
    if (!isDown) return;
    isDown = false;
    el.classList.remove('dragging');
    // reset after the click event that follows mouseup has fired
    setTimeout(() => { isDragging = false; }, 0);
  });
}

// ─── Info bar ───────────────────────────────────────────────────────────────
let activeChip = null;

function selectChip(chipEl, ship) {
  if (activeChip) activeChip.classList.remove('active');
  activeChip = chipEl;
  chipEl.classList.add('active');

  document.getElementById('tl-info-content').innerHTML = buildInfoHTML(ship);
  document.getElementById('tl-info-bar').classList.add('open');
}

function closeInfoBar() {
  document.getElementById('tl-info-bar').classList.remove('open');
  if (activeChip) { activeChip.classList.remove('active'); activeChip = null; }
}

function buildInfoHTML(ship) {
  const announced = ship.announced
    ? `${ship.announced_uncertain ? '<span style="color:var(--amber)" title="Approximate">~</span> ' : ''}${fmtFull(ship.announced)}`
    : '<span style="color:var(--text-dimmer);font-style:italic">Unknown</span>';

  let flyableHTML = '';
  if (ship.status === 'flyable' && ship.flyable_date) {
    flyableHTML = `
      <div class="tl-info-field">
        <span class="tl-info-label">Flyable</span>
        <span class="tl-info-value">${fmtFull(ship.flyable_date)} <span class="tl-info-patch">${escHtml(ship.flyable_patch)}</span></span>
      </div>`;
  } else {
    flyableHTML = `
      <div class="tl-info-field">
        <span class="tl-info-label">Flyable</span>
        <span class="tl-info-value" style="color:var(--text-dimmer);font-style:italic">Not yet released</span>
      </div>`;
  }

  let deltaHTML = '';
  if (ship.status === 'flyable' && ship.announced && ship.flyable_date) {
    const d = calcDelta(ship.announced, ship.flyable_date);
    if (d) deltaHTML = `
      <div class="tl-info-field">
        <span class="tl-info-label">Duration</span>
        <span class="tl-info-delta flyable">${d}</span>
        <span class="tl-info-delta-sub">Announced → Flyable</span>
      </div>`;
  } else if (ship.status === 'unreleased' && ship.announced) {
    const today = new Date().toISOString().slice(0, 10);
    const d = calcDelta(ship.announced, today);
    if (d) deltaHTML = `
      <div class="tl-info-field">
        <span class="tl-info-label">Waiting</span>
        <span class="tl-info-delta waiting">${d}</span>
        <span class="tl-info-delta-sub">Since announced — still waiting</span>
      </div>`;
  }

  return `
    <div class="tl-info-ship">
      <div class="tl-info-name">${escHtml(ship.name)}</div>
      <div class="tl-info-mfr">${escHtml(ship.manufacturer)}</div>
    </div>
    <div class="tl-info-field">
      <span class="tl-info-label">Announced</span>
      <span class="tl-info-value">${announced}</span>
    </div>
    ${flyableHTML}
    ${deltaHTML}`;
}

// ─── Date helpers ───────────────────────────────────────────────────────────
function fmtMonthYear(dateStr) {
  const d = new Date(dateStr + 'T00:00:00');
  return d.toLocaleString('en-US', { month: 'short', year: 'numeric' });
}

function fmtFull(dateStr) {
  const d = new Date(dateStr + 'T00:00:00');
  return d.toLocaleString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
}

function calcDelta(a, b) {
  if (!a || !b) return null;
  const da = new Date(a + 'T00:00:00');
  const db = new Date(b + 'T00:00:00');
  if (db <= da) return null;
  let years = db.getFullYear() - da.getFullYear();
  let months = db.getMonth() - da.getMonth();
  if (months < 0) { years--; months += 12; }
  const parts = [];
  if (years  > 0) parts.push(`${years} yr${years   !== 1 ? 's' : ''}`);
  if (months > 0) parts.push(`${months} mo`);
  return parts.length ? parts.join(' ') : '< 1 month';
}

function escHtml(s) {
  return String(s)
    .replace(/&/g, '&amp;').replace(/</g, '&lt;')
    .replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#39;');
}

init();
