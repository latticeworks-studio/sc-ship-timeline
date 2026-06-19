'use strict';
const fs = require('fs');
const path = require('path');

// role values: fighter | exploration | freight | mining | salvage | support | dropship | racing | capital | ground
const ROLES = {
  // ── RSI ──────────────────────────────────────────────────────────────────
  'Aurora Mk I CL': 'freight',      'Aurora Mk I ES': 'exploration', 'Aurora Mk I LN': 'fighter',
  'Aurora Mk I LX': 'fighter',      'Aurora Mk I MR': 'freight',     'Aurora Mk I SE': 'freight',
  'Aurora Mk II': 'fighter',
  'Constellation Andromeda': 'freight',  'Constellation Aquila': 'exploration',
  'Constellation Phoenix': 'support',    'Constellation Phoenix Emerald': 'support',
  'Constellation Taurus': 'freight',
  'Mantis': 'fighter',     'Scorpius': 'fighter',   'Scorpius Antares': 'fighter',
  'Retaliator': 'fighter', 'Retaliator Bomber': 'fighter',
  'Bengal': 'capital',  'Pegasus': 'capital',   'Polaris': 'capital',
  'M50': 'racing',
  'Genesis': 'support',
  'Hermes': 'freight',
  'Zeus Mk II CL': 'freight',  'Zeus Mk II ES': 'exploration',  'Zeus Mk II MR': 'fighter',
  'Arrastra': 'mining',
  'Odyssey': 'exploration',
  'Starlancer MAX': 'freight',  'Starlancer TAC': 'fighter',  'Starlancer BLD': 'fighter',
  'Salvation': 'fighter',
  'Mercury': 'freight',
  'Meteor': 'fighter',
  'Lynx': 'ground',  'Ursa': 'ground',  'Ursa Fortuna': 'ground',  'Ursa Medivac': 'ground',
  // ── CNOU ────────────────────────────────────────────────────────────────
  'Mustang Alpha': 'freight',         'Mustang Alpha Vindicator': 'fighter',
  'Mustang Beta': 'exploration',      'Mustang Delta': 'fighter',
  'Mustang Gamma': 'racing',          'Mustang Omega': 'racing',
  // ── Anvil ───────────────────────────────────────────────────────────────
  'Arrow': 'fighter',
  'Ballista': 'ground',  'Ballista Dunestalker': 'ground',  'Ballista Snowblind': 'ground',
  'C8 Pisces': 'exploration',  'C8X Pisces Expedition': 'exploration',  'C8R Pisces': 'support',
  'Carrack': 'exploration',  'Carrack Expedition': 'exploration',
  'Centurion': 'ground',  'Spartan': 'ground',
  'F7A Hornet Mk I': 'fighter',
  'F7C Hornet Mk I': 'fighter',          'F7C Hornet Mk II': 'fighter',
  'F7C Hornet Wildfire Mk I': 'fighter', 'F7C-M Super Hornet Heartseeker Mk I': 'fighter',
  'F7C-M Super Hornet Mk I': 'fighter',  'F7C-M Super Hornet Mk II': 'fighter',
  'F7C-R Hornet Tracker Mk I': 'fighter','F7C-R Hornet Tracker Mk II': 'fighter',
  'F7C-S Hornet Ghost Mk I': 'fighter',  'F7C-S Hornet Ghost Mk II': 'fighter',
  'F8C Lightning': 'fighter',  'F8C Lightning Executive Edition': 'fighter',
  'Gladiator': 'fighter',  'Hawk': 'fighter',  'Hurricane': 'fighter',
  'Legionnaire': 'dropship',
  'Terrapin': 'exploration',
  'Valkyrie': 'dropship',  'Valkyrie Liberator Edition': 'dropship',
  'Warlock': 'support',  'Crucible': 'support',
  'Asgard': 'dropship',
  // ── Aegis ───────────────────────────────────────────────────────────────
  'Avenger Titan': 'fighter',  'Avenger Titan Renegade': 'fighter',
  'Avenger Stalker': 'fighter',  'Avenger Warlock': 'support',
  'Eclipse': 'fighter',
  'Gladius': 'fighter',  'Gladius Pirate Edition': 'fighter',  'Gladius Valiant': 'fighter',
  'Hammerhead': 'capital',  'Idris-M': 'capital',  'Idris-P': 'capital',
  'Javelin': 'capital',
  'Nautilus': 'capital',  'Nautilus Solstice Edition': 'capital',
  'Reclaimer': 'salvage',
  'Redeemer': 'fighter',
  'Sabre': 'fighter',  'Sabre Comet': 'fighter',  'Sabre Raven': 'fighter',  'Sabre Firebird': 'fighter',
  'Vanguard Warden': 'fighter',  'Vanguard Harbinger': 'fighter',
  'Vanguard Hoplite': 'dropship',  'Vanguard Sentinel': 'fighter',
  'Vulcan': 'support',
  // ── Drake ───────────────────────────────────────────────────────────────
  'Buccaneer': 'fighter',
  'Caterpillar': 'freight',
  'Corsair': 'exploration',
  'Cutter': 'freight',  'Cutter Rambler': 'exploration',  'Cutter Scout': 'exploration',
  'Cutlass Black': 'fighter',  'Cutlass Blue': 'support',
  'Cutlass Red': 'support',    'Cutlass Steel': 'dropship',
  'Dragonfly': 'ground',  'Dragonfly Yellowjacket': 'ground',
  'Golem': 'ground',  'Golem OX': 'ground',
  'Herald': 'support',
  'Ironclad': 'freight',  'Ironclad Assault': 'dropship',
  'Kraken': 'capital',  'Kraken Privateer': 'freight',
  'Mule': 'ground',
  'Pitbull': 'fighter',
  'Vulture': 'salvage',
  'Clipper': 'freight',
  // ── MISC ────────────────────────────────────────────────────────────────
  'Endeavor': 'exploration',  'Expanse': 'salvage',  'Fortune': 'freight',
  'Freelancer': 'freight',  'Freelancer DUR': 'exploration',
  'Freelancer MAX': 'freight',  'Freelancer MIS': 'fighter',
  'Hull A': 'freight',  'Hull B': 'freight',  'Hull C': 'freight',
  'Hull D': 'freight',  'Hull E': 'freight',
  'Prospector': 'mining',
  'Reliant Kore': 'freight',  'Reliant Mako': 'support',
  'Reliant Sen': 'exploration',  'Reliant Tana': 'fighter',
  'Starfarer': 'support',  'Starfarer Gemini': 'support',
  'Starlite': 'freight',
  // ── Argo ────────────────────────────────────────────────────────────────
  'MPUV Cargo': 'freight',  'MPUV Personnel': 'freight',  'MPUV Tractor': 'freight',
  'MOLE': 'mining',  'Argo Mole Carbon Edition': 'mining',  'Argo Mole Talus Edition': 'mining',
  'SRV': 'support',
  'ATLS': 'ground',  'ATLS GEO': 'ground',  'CSV-SM': 'ground',
  // ── Greycat ─────────────────────────────────────────────────────────────
  'ROC': 'mining',  'ROC-DS': 'mining',
  'PTV': 'ground',  'MDC': 'ground',  'MTC': 'ground',  'UTV': 'ground',  'STV': 'ground',
  // ── Tumbril ─────────────────────────────────────────────────────────────
  'Cyclone': 'ground',  'Cyclone AA': 'ground',  'Cyclone MT': 'ground',
  'Cyclone RN': 'ground',  'Cyclone TR': 'ground',
  'Nova': 'ground',
  'Ranger CV': 'ground',  'Ranger RC': 'ground',  'Ranger TR': 'ground',
  'Storm': 'ground',  'Storm AA': 'ground',
  // ── Origin ──────────────────────────────────────────────────────────────
  '100i': 'freight',   '125a': 'fighter',    '150i': 'racing',
  '300i': 'freight',   '315p': 'exploration', '325a': 'fighter',  '350r': 'racing',
  '400i': 'freight',
  '600i': 'exploration',  '600i Executive Edition': 'exploration',  '600i Touring': 'exploration',
  '890 Jump': 'exploration',
  'G12': 'ground',  'G12a': 'ground',  'G12r': 'ground',
  'X1': 'racing',  'X1 Force': 'fighter',  'X1 Velocity': 'racing',
  // ── Esperia ─────────────────────────────────────────────────────────────
  'Blade': 'fighter',  'Glaive': 'fighter',
  'Prowler': 'dropship',  'Prowler Utility': 'freight',
  'Talon': 'fighter',  'Talon Shrike': 'fighter',
  'Stinger': 'fighter',  'Scythe': 'fighter',
  // ── Gatac ───────────────────────────────────────────────────────────────
  'Syulen': 'fighter',  'Railen': 'freight',
  // ── Banu ────────────────────────────────────────────────────────────────
  'Defender': 'fighter',  'Merchantman': 'freight',
  // ── Aopoa / Xi'An ───────────────────────────────────────────────────────
  "San'tok.yāi": 'fighter',  'Khartu-al': 'fighter',
  'Nox': 'racing',  'Nox Kue': 'racing',
  // ── Mirai ───────────────────────────────────────────────────────────────
  'Fury': 'fighter',  'Fury LX': 'fighter',  'Fury MX': 'fighter',
  'Guardian': 'fighter',  'Guardian MX': 'fighter',  'Guardian QI': 'support',
  'Pulse': 'racing',  'Pulse LX': 'racing',
  'Razor': 'racing',  'Razor EX': 'racing',  'Razor LX': 'racing',
  // ── Kruger ──────────────────────────────────────────────────────────────
  'P-52 Merlin': 'fighter',
  'P-72 Archimedes': 'racing',  'P-72 Archimedes Emerald': 'racing',
  'L-21 Wolf': 'fighter',  'L-22 Alpha Wolf': 'fighter',
  // ── Crusader ────────────────────────────────────────────────────────────
  'A1 Spirit': 'fighter',  'C1 Spirit': 'freight',  'E1 Spirit': 'exploration',
  // ── Grey's Market ───────────────────────────────────────────────────────
  'Shiv': 'ground',
  // ── Fill-ins caught on second pass ──────────────────────────────────────
  'Perseus': 'capital',
  'Galaxy': 'support',
  'Dragonfly Black': 'ground',
  '85X': 'exploration',
  '135c': 'freight',
  '600i Explorer': 'exploration',
  'Ares Ion': 'fighter',       'Ares Inferno': 'fighter',
  'C2 Hercules': 'freight',    'M2 Hercules': 'freight',   'A2 Hercules': 'dropship',
  'Nomad': 'freight',
  'Mole': 'mining',            'Raft': 'freight',
  'UTC': 'ground',
  'Sabre Peregrine': 'fighter','Tiburon': 'fighter',
  'F7A Hornet Mk II': 'fighter',
  'Liberator': 'dropship',
  'Paladin': 'fighter',        'Odin': 'fighter',
  'Terrapin Medic': 'support',
  'M80': 'fighter',
  'Apollo Triage': 'support',  'Apollo Medivac': 'support',
  'Orion': 'mining',
  'Intrepid': 'exploration',
  'Khartu-Al': 'fighter',
  'Tyilui': 'fighter',
  'MOTH': 'support',
  'Cyclone RC': 'ground',
  'Pioneer': 'support',
  'HoverQuad': 'ground',
};

const dataPath = path.join(__dirname, '..', 'data', 'ships.json');
const ships = JSON.parse(fs.readFileSync(dataPath));

let assigned = 0, skipped = 0;
ships.forEach(s => {
  const role = ROLES[s.name];
  if (role) { s.role = role; assigned++; }
  else       { s.role = null; skipped++; }
});

fs.writeFileSync(dataPath, JSON.stringify(ships, null, 2));

// Update meta.json last_updated
const metaPath = path.join(__dirname, '..', 'data', 'meta.json');
const today = new Date().toISOString().slice(0, 10);
fs.writeFileSync(metaPath, JSON.stringify({ last_updated: today }, null, 2) + '\n');

console.log(`Roles assigned: ${assigned}  |  No role: ${skipped}  |  Total: ${ships.length}`);
