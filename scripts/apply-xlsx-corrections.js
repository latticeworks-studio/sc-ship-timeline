'use strict';
const XLSX = require('C:/Users/theca/AppData/Local/Temp/claude/d--LatticeWorks-SC-Ship-Timeline/5e9f315c-078b-4d75-b5e9-46b5b43ee900/scratchpad/node_modules/xlsx');
const fs   = require('fs');
const path = require('path');

// ── helpers ────────────────────────────────────────────────────────────────
function xlDate(serial) {
  if (!serial || typeof serial !== 'number') return null;
  return new Date(Math.round((serial - 25569) * 86400 * 1000)).toISOString().slice(0, 10);
}

function normalizePatch(p) {
  if (!p) return p;
  // Strip trailing ".0" only from pure numeric suffix  (e.g. 4.0.0→4.0, 3.8.0→3.8)
  // but NOT from "3.20.0b" (ends in "0b", not ".0")
  return p.replace(/\.0$/, '');
}

// xlsx ship name → our ships.json name
// 'skip' means we intentionally ignore this entry
const NAME_MAP = {
  'Aurora CL':  'Aurora Mk I CL', 'Aurora ES':  'Aurora Mk I ES',
  'Aurora LN':  'Aurora Mk I LN', 'Aurora LX':  'Aurora Mk I LX',
  'Aurora MR':  'Aurora Mk I MR',
  'Retaliator "Base"':   'Retaliator',
  'Retaliator "Bomber"': 'Retaliator Bomber',
  'Retaliator "Cargo"':  'skip',          // no separate entry
  'C8R Pisces Rescue':   'C8R Pisces',
  'RAFT':                'Raft',
  'MOLE':                'Mole',
  'Khartu-al':           'Khartu-Al',
  '600i Explorer "600i"':'600i Explorer',
  'F7C-M SH Heartseeker Mk I': 'F7C-M Super Hornet Heartseeker Mk I',
  'Idris':               'Idris-P',
};

// Ships from xlsx that don't exist in ships.json yet — add them
const NEW_SHIPS = [
  {
    id: 'f7c-s-hornet-ghost-mk-ii',
    name: 'F7C-S Hornet Ghost Mk II',
    manufacturer: 'Anvil Aerospace', manufacturer_short: 'Anvil',
    announced: '2024-11-30', announced_uncertain: true,
    flyable_patch: 'Alpha 3.24.3', flyable_date: '2024-11-30', flyable_uncertain: false,
    status: 'flyable', role: 'fighter',
  },
  {
    id: 'f7c-r-hornet-tracker-mk-ii',
    name: 'F7C-R Hornet Tracker Mk II',
    manufacturer: 'Anvil Aerospace', manufacturer_short: 'Anvil',
    announced: '2024-11-30', announced_uncertain: true,
    flyable_patch: 'Alpha 3.24.3', flyable_date: '2024-11-30', flyable_uncertain: false,
    status: 'flyable', role: 'fighter',
  },
];

// ── load data ──────────────────────────────────────────────────────────────
const wb = XLSX.readFile('D:/LatticeWorks/SC Ship Timeline/Ships_list.xlsx');
const ws = wb.Sheets[wb.SheetNames[0]];
const rows = XLSX.utils.sheet_to_json(ws, { defval: '' });

const xlShips = rows.slice(2)
  .filter(r => r['__EMPTY_4'] === 'Flight ready' && r['__EMPTY'])
  .map(r => {
    const rawName = String(r['__EMPTY']).trim();
    const name = NAME_MAP.hasOwnProperty(rawName) ? NAME_MAP[rawName] : rawName;
    let patch = normalizePatch(String(r['Dates']).trim());
    // Fix typo: Alpha 4.21 → Alpha 4.2.1
    if (patch === 'Alpha 4.21') patch = 'Alpha 4.2.1';
    return { rawName, name, patch, date: xlDate(r['__EMPTY_5']) };
  })
  .filter(r => r.name !== 'skip');

const dataPath = path.join(__dirname, '..', 'data', 'ships.json');
let ships = JSON.parse(fs.readFileSync(dataPath));
const shipMap = new Map(ships.map(s => [s.name, s]));

// ── apply updates ──────────────────────────────────────────────────────────
const updated  = [];
const noMatch  = [];
const seenNames = new Set();

for (const xl of xlShips) {
  if (seenNames.has(xl.name)) continue; // skip duplicates (e.g. Retaliator appearing twice)
  seenNames.add(xl.name);

  const ship = shipMap.get(xl.name);
  if (!ship) { noMatch.push(xl); continue; }

  const oldPatch = ship.flyable_patch;
  const oldDate  = ship.flyable_date;
  const oldStatus = ship.status;

  let changed = false;
  if (ship.status !== 'flyable')         { ship.status = 'flyable'; changed = true; }
  if (ship.flyable_patch !== xl.patch)   { ship.flyable_patch = xl.patch; changed = true; }
  if (ship.flyable_date  !== xl.date)    { ship.flyable_date  = xl.date;  changed = true; }
  ship.flyable_uncertain = false;

  if (changed) updated.push({ name: xl.name, oldPatch, oldDate, oldStatus, newPatch: xl.patch, newDate: xl.date });
}

// ── add new ships ──────────────────────────────────────────────────────────
for (const ns of NEW_SHIPS) {
  if (!shipMap.has(ns.name)) {
    ships.push(ns);
    updated.push({ name: ns.name, oldPatch: null, oldDate: null, oldStatus: null, newPatch: ns.flyable_patch, newDate: ns.flyable_date, added: true });
  }
}

// ── write output ───────────────────────────────────────────────────────────
fs.writeFileSync(dataPath, JSON.stringify(ships, null, 2));

const metaPath = path.join(__dirname, '..', 'data', 'meta.json');
const today = new Date().toISOString().slice(0, 10);
fs.writeFileSync(metaPath, JSON.stringify({ last_updated: today }, null, 2) + '\n');

// ── report ─────────────────────────────────────────────────────────────────
console.log(`\n${'═'.repeat(60)}`);
console.log('SHIPS UPDATED:', updated.length);
console.log('NO MATCH (skipped):', noMatch.length);
console.log('═'.repeat(60));

const added    = updated.filter(u => u.added);
const statusFix = updated.filter(u => !u.added && u.oldStatus === 'unreleased');
const patchFix  = updated.filter(u => !u.added && u.oldStatus !== 'unreleased');

if (added.length) {
  console.log('\n── ADDED (new ships) ─────────────────────────────────────');
  added.forEach(u => console.log(`  + ${u.name}  →  ${u.newPatch}  (${u.newDate})`));
}
if (statusFix.length) {
  console.log('\n── STATUS FIXED  unreleased → flyable ───────────────────');
  statusFix.forEach(u => console.log(`  ✓ ${u.name}  →  ${u.newPatch}  (${u.newDate})`));
}
if (patchFix.length) {
  console.log('\n── PATCH / DATE CORRECTED ────────────────────────────────');
  patchFix.forEach(u => console.log(`  ~ ${u.name}  ${u.oldPatch} (${u.oldDate})  →  ${u.newPatch} (${u.newDate})`));
}
if (noMatch.length) {
  console.log('\n── NO MATCH IN ships.json ────────────────────────────────');
  noMatch.forEach(u => console.log(`  ? ${u.rawName}`));
}
console.log('');
