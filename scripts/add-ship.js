'use strict';
const fs       = require('fs');
const path     = require('path');
const readline = require('readline');

const DATA_PATH = path.join(__dirname, '..', 'data', 'ships.json');
const META_PATH = path.join(__dirname, '..', 'data', 'meta.json');

const ROLES = ['fighter','exploration','freight','mining','salvage','support','dropship','racing','capital','ground'];

const MFR_SHORTS = {
  'Roberts Space Industries': 'RSI',
  'Anvil Aerospace':          'Anvil',
  'Drake Interplanetary':     'Drake',
  'Aegis Dynamics':           'Aegis',
  'MISC':                     'MISC',
  'Mirai':                    'Mirai',
  'Origin Jumpworks':         'Origin',
  'Crusader Industries':      'Crusader',
  'Esperia':                  'Esperia',
  'Banu':                     'Banu',
  'Gatac Manufacture':        'Gatac',
  "Xi'An":                    "Xi'An",
  'Consolidated Outland':     'C.O.',
  'Argo Astronautics':        'Argo',
  'Tumbril Land Systems':     'Tumbril',
  'Greycat Industrial':       'Greycat',
  'Aopoa':                    'Aopoa',
  'Kruger Intergalactic':     'Kruger',
  "Grey's Market":            "Grey's",
};

function toId(name) {
  return name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
}

function ask(rl, question, validate) {
  return new Promise(resolve => {
    const prompt = () => rl.question(question, ans => {
      ans = ans.trim();
      if (validate) {
        const err = validate(ans);
        if (err) { console.log(`  ✗ ${err}`); return prompt(); }
      }
      resolve(ans);
    });
    prompt();
  });
}

function isValidDate(s) {
  if (!s) return true; // optional
  return /^\d{4}-\d{2}-\d{2}$/.test(s) && !isNaN(new Date(s + 'T00:00:00'));
}

async function main() {
  const ships = JSON.parse(fs.readFileSync(DATA_PATH));
  const shipByName = new Map(ships.map(s => [s.name.toLowerCase(), s]));

  const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
  const close = () => rl.close();

  console.log('\n── Add / update a ship ───────────────────────────────────────\n');

  // ── Name ──────────────────────────────────────────────────────────────────
  const name = await ask(rl, 'Ship name: ', v => v ? null : 'Required');
  const existing = shipByName.get(name.toLowerCase());

  if (existing) {
    console.log(`\n  Found existing entry: ${existing.name} (${existing.status})`);
    if (existing.status === 'flyable') {
      console.log('  This ship is already flyable. Updating patch/date.\n');
    } else {
      console.log('  Marking as flyable.\n');
    }
  } else {
    console.log('  New ship — will be added.\n');
  }

  // ── Manufacturer ──────────────────────────────────────────────────────────
  const defaultMfr = existing?.manufacturer || '';
  const mfrPrompt  = defaultMfr ? `Manufacturer [${defaultMfr}]: ` : 'Manufacturer (full name): ';
  const mfrRaw     = await ask(rl, mfrPrompt);
  const manufacturer = mfrRaw || defaultMfr;
  if (!manufacturer) { console.log('\nAborted — manufacturer required.'); return close(); }

  let manufacturer_short = MFR_SHORTS[manufacturer];
  if (!manufacturer_short) {
    manufacturer_short = await ask(rl, `  Short name for "${manufacturer}": `, v => v ? null : 'Required');
  } else {
    console.log(`  → Short: ${manufacturer_short}`);
  }

  // ── Flyable patch ──────────────────────────────────────────────────────────
  const patchPrompt = existing?.flyable_patch
    ? `Flyable patch [${existing.flyable_patch}]: ` : 'Flyable patch (e.g. Alpha 4.3): ';
  const patchRaw    = await ask(rl, patchPrompt);
  const flyable_patch = patchRaw || existing?.flyable_patch;
  if (!flyable_patch) { console.log('\nAborted — patch required.'); return close(); }

  // ── Flyable date ───────────────────────────────────────────────────────────
  const datePrompt = existing?.flyable_date
    ? `Flyable date [${existing.flyable_date}]: ` : 'Flyable date (YYYY-MM-DD): ';
  const dateRaw    = await ask(rl, datePrompt, v => {
    if (!v && existing?.flyable_date) return null;
    return isValidDate(v) ? null : 'Use YYYY-MM-DD format';
  });
  const flyable_date = dateRaw || existing?.flyable_date;
  if (!flyable_date) { console.log('\nAborted — date required.'); return close(); }

  // ── Role ───────────────────────────────────────────────────────────────────
  const defaultRole = existing?.role || '';
  const roleHint    = ROLES.join('/');
  const rolePrompt  = defaultRole
    ? `Role [${defaultRole}]: ` : `Role (${roleHint}): `;
  const roleRaw     = await ask(rl, rolePrompt, v => {
    const r = v || defaultRole;
    return ROLES.includes(r) ? null : `Must be one of: ${roleHint}`;
  });
  const role = roleRaw || defaultRole;

  // ── Announced date (optional, new ships only) ──────────────────────────────
  let announced          = existing?.announced        || flyable_date;
  let announced_uncertain = existing?.announced_uncertain ?? true;

  if (!existing) {
    const annRaw = await ask(rl, `Announced date (YYYY-MM-DD, or Enter = same as flyable): `, v => {
      return (!v || isValidDate(v)) ? null : 'Use YYYY-MM-DD format';
    });
    if (annRaw) {
      announced           = annRaw;
      announced_uncertain = false;
    } else {
      announced           = flyable_date;
      announced_uncertain = true;
      console.log('  → Announced set to flyable date (marked uncertain)');
    }
  }

  // ── Apply ──────────────────────────────────────────────────────────────────
  console.log('');
  let action;

  if (existing) {
    existing.manufacturer       = manufacturer;
    existing.manufacturer_short = manufacturer_short;
    existing.flyable_patch      = flyable_patch;
    existing.flyable_date       = flyable_date;
    existing.status             = 'flyable';
    existing.role               = role;
    action = 'updated';
  } else {
    const newShip = {
      id: toId(name),
      name,
      manufacturer,
      manufacturer_short,
      announced,
      announced_uncertain,
      flyable_patch,
      flyable_date,
      status: 'flyable',
      role,
    };
    ships.push(newShip);
    action = 'added';
  }

  fs.writeFileSync(DATA_PATH, JSON.stringify(ships, null, 2));

  const today = new Date().toISOString().slice(0, 10);
  fs.writeFileSync(META_PATH, JSON.stringify({ last_updated: today }, null, 2) + '\n');

  // ── Summary ────────────────────────────────────────────────────────────────
  const ship = existing || ships[ships.length - 1];
  console.log(`✓ ${action === 'added' ? 'Added' : 'Updated'}: ${ship.name}`);
  console.log(`  ID:           ${ship.id}`);
  console.log(`  Manufacturer: ${ship.manufacturer} (${ship.manufacturer_short})`);
  console.log(`  Flyable:      ${ship.flyable_patch}  (${ship.flyable_date})`);
  console.log(`  Announced:    ${ship.announced}${ship.announced_uncertain ? ' ~' : ''}`);
  console.log(`  Role:         ${ship.role}`);
  console.log(`  meta.json:    ${today}\n`);

  close();
}

main().catch(err => { console.error(err); process.exit(1); });
