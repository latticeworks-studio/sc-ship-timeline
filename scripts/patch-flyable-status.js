'use strict';
const fs = require('fs');
const path = require('path');

// Research sources: starcitizen.tools wiki, MassivelyOP, SCFocus, TheImpound, SimulationDaily
const UPDATES = [
  // ATLS — first appeared with Alpha 3.24.1 ("ATLS Power Suits Released")
  { name: 'ATLS',           flyable_patch: 'Alpha 3.24.1', flyable_date: '2024-09-13', flyable_uncertain: false },
  // ATLS GEO — launched with Alpha 4.1.0 on March 27 2025
  { name: 'ATLS GEO',       flyable_patch: 'Alpha 4.1',    flyable_date: '2025-03-27', flyable_uncertain: false },
  // Aurora Mk II — new starter ship launched with Alpha 4.7 on March 26 2026
  { name: 'Aurora Mk II',   flyable_patch: 'Alpha 4.7',    flyable_date: '2026-03-26', flyable_uncertain: false },
  // CSV-SM — straight-to-flyable in Alpha 4.6 (Jan 28 2026)
  { name: 'CSV-SM',         flyable_patch: 'Alpha 4.6',    flyable_date: '2026-01-28', flyable_uncertain: false },
  // Drake Golem — Invictus 2025 starter mining ship, Alpha 4.1.1 (May 15 2025)
  { name: 'Golem',          flyable_patch: 'Alpha 4.1.1',  flyable_date: '2025-05-15', flyable_uncertain: false },
  // Golem OX — cargo variant, straight-to-flyable at IAE 2955 / Alpha 4.4 (Nov 19 2025)
  { name: 'Golem OX',       flyable_patch: 'Alpha 4.4',    flyable_date: '2025-11-19', flyable_uncertain: false },
  // L-21 Wolf — Kruger's first in-house ship, Alpha 4.3 live Aug 16 2025
  { name: 'L-21 Wolf',      flyable_patch: 'Alpha 4.3',    flyable_date: '2025-08-16', flyable_uncertain: false },
  // L-22 Alpha Wolf — straight-to-flyable at IAE 2955 / Alpha 4.4 (Nov 19 2025)
  { name: 'L-22 Alpha Wolf', flyable_patch: 'Alpha 4.4',   flyable_date: '2025-11-19', flyable_uncertain: false },
  // Greycat MDC — IAE 2955 debut, straight-to-flyable / Alpha 4.4 (Nov 19 2025)
  { name: 'MDC',            flyable_patch: 'Alpha 4.4',    flyable_date: '2025-11-19', flyable_uncertain: false },
  // Greycat MTC — revealed ahead of Invictus, Alpha 4.1.1 (May 15 2025)
  { name: 'MTC',            flyable_patch: 'Alpha 4.1.1',  flyable_date: '2025-05-15', flyable_uncertain: false },
  // Grey's Market Shiv — new flyable ship in Alpha 4.3.2 (Oct 16 2025)
  { name: 'Shiv',           flyable_patch: 'Alpha 4.3.2',  flyable_date: '2025-10-16', flyable_uncertain: false },
  // Anvil Spartan APC — Alpha 3.15.1 (Nov 19 2021)
  { name: 'Spartan',        flyable_patch: 'Alpha 3.15.1', flyable_date: '2021-11-19', flyable_uncertain: false },
  // Esperia Stinger — new flyable ship in Alpha 4.3.2 (Oct 16 2025)
  { name: 'Stinger',        flyable_patch: 'Alpha 4.3.2',  flyable_date: '2025-10-16', flyable_uncertain: false },
  // Greycat UTV — straight-to-flyable in Alpha 4.7.1 (Apr 8 2026)
  { name: 'UTV',            flyable_patch: 'Alpha 4.7.1',  flyable_date: '2026-04-08', flyable_uncertain: false },
];

const dataPath = path.join(__dirname, '..', 'data', 'ships.json');
const ships = JSON.parse(fs.readFileSync(dataPath));

let updated = 0;
for (const upd of UPDATES) {
  const ship = ships.find(s => s.name === upd.name);
  if (!ship) { console.warn('NOT FOUND:', upd.name); continue; }
  ship.status         = 'flyable';
  ship.flyable_patch  = upd.flyable_patch;
  ship.flyable_date   = upd.flyable_date;
  ship.flyable_uncertain = upd.flyable_uncertain;
  console.log(`Updated: ${ship.name}  →  ${upd.flyable_patch}  (${upd.flyable_date})`);
  updated++;
}

fs.writeFileSync(dataPath, JSON.stringify(ships, null, 2));

// Bump meta.json
const metaPath = path.join(__dirname, '..', 'data', 'meta.json');
const today = new Date().toISOString().slice(0, 10);
fs.writeFileSync(metaPath, JSON.stringify({ last_updated: today }, null, 2) + '\n');

console.log(`\nDone. ${updated}/${UPDATES.length} ships updated.`);
