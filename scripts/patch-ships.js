const fs = require('fs');
const path = require('path');

const dataPath = path.join(__dirname, '..', 'data', 'ships.json');
let ships = JSON.parse(fs.readFileSync(dataPath));

// ── Name corrections ──────────────────────────────────────────────────────────
const nameMap = {
  'Aurora MR':              'Aurora Mk I MR',
  'Aurora LN':              'Aurora Mk I LN',
  'Aurora LX':              'Aurora Mk I LX',
  'Aurora ES':              'Aurora Mk I ES',
  'Aurora CL':              'Aurora Mk I CL',
  'Spirit A1':              'A1 Spirit',
  'Spirit C1':              'C1 Spirit',
  'Spirit E1':              'E1 Spirit',
  'A2 Hercules Starlifter': 'A2 Hercules',
  'C2 Hercules Starlifter': 'C2 Hercules',
  'M2 Hercules Starlifter': 'M2 Hercules',
  'Mercury Star Runner':    'Mercury',
  'Nova Tank':              'Nova',
  'Dragonfly Yellow':       'Dragonfly Yellowjacket',
  'C8R Pisces Rescue':      'C8R Pisces',
  'Guardian LX':            'Guardian MX',
  'Retaliator Base':        'Retaliator',
  'Genesis Starliner':      'Genesis',
  "San'tok.yai":            "San'tok.yāi",
  'F7C Hornet':             'F7C Hornet Mk I',
  'F7C-M Super Hornet':     'F7C-M Super Hornet Mk I',
  'F7C-R Hornet Tracker':   'F7C-R Hornet Tracker Mk I',
  'F7C-S Hornet Ghost':     'F7C-S Hornet Ghost Mk I',
};
ships.forEach(s => { if (nameMap[s.name]) s.name = nameMap[s.name]; });

// ── Manufacturer corrections: Razor series is Mirai, not MISC ─────────────────
const mfrFix = new Set(['razor', 'razor-ex', 'razor-lx']);
ships.forEach(s => {
  if (mfrFix.has(s.id)) {
    s.manufacturer = 'Mirai';
    s.manufacturer_short = 'Mirai';
  }
});

// ── Add missing ships ─────────────────────────────────────────────────────────
const existing = new Set(ships.map(s => s.id));

const add = [
  // Aegis
  { id:'avenger-titan-renegade',   name:'Avenger Titan Renegade',         manufacturer:'Aegis Dynamics',           manufacturer_short:'Aegis',    announced:'2017-01-01', announced_uncertain:true,  flyable_patch:'Arena Commander v0.9', flyable_date:'2014-09-01', flyable_uncertain:true,  status:'flyable'    },
  { id:'nautilus-solstice',        name:'Nautilus Solstice Edition',       manufacturer:'Aegis Dynamics',           manufacturer_short:'Aegis',    announced:'2019-01-01', announced_uncertain:true,  flyable_patch:'Alpha 3.9',            flyable_date:'2020-04-01', flyable_uncertain:true,  status:'flyable'    },
  // Anvil
  { id:'ballista',                 name:'Ballista',                        manufacturer:'Anvil Aerospace',          manufacturer_short:'Anvil',    announced:'2019-10-10', announced_uncertain:false, flyable_patch:'Alpha 3.8',            flyable_date:'2019-12-20', flyable_uncertain:true,  status:'flyable'    },
  { id:'ballista-dunestalker',     name:'Ballista Dunestalker',            manufacturer:'Anvil Aerospace',          manufacturer_short:'Anvil',    announced:'2019-10-10', announced_uncertain:true,  flyable_patch:'Alpha 3.8',            flyable_date:'2019-12-20', flyable_uncertain:true,  status:'flyable'    },
  { id:'ballista-snowblind',       name:'Ballista Snowblind',              manufacturer:'Anvil Aerospace',          manufacturer_short:'Anvil',    announced:'2019-10-10', announced_uncertain:true,  flyable_patch:'Alpha 3.8',            flyable_date:'2019-12-20', flyable_uncertain:true,  status:'flyable'    },
  { id:'centurion',                name:'Centurion',                       manufacturer:'Anvil Aerospace',          manufacturer_short:'Anvil',    announced:'2019-10-10', announced_uncertain:true,  flyable_patch:null,                   flyable_date:null,         flyable_uncertain:false, status:'unreleased' },
  { id:'spartan',                  name:'Spartan',                         manufacturer:'Anvil Aerospace',          manufacturer_short:'Anvil',    announced:'2019-10-10', announced_uncertain:true,  flyable_patch:null,                   flyable_date:null,         flyable_uncertain:false, status:'unreleased' },
  { id:'hornet-wildfire-mk1',      name:'F7C Hornet Wildfire Mk I',        manufacturer:'Anvil Aerospace',          manufacturer_short:'Anvil',    announced:'2019-01-01', announced_uncertain:true,  flyable_patch:'Alpha 3.17',           flyable_date:'2022-04-01', flyable_uncertain:true,  status:'flyable'    },
  { id:'hornet-heartseeker-mk1',   name:'F7C-M Super Hornet Heartseeker Mk I', manufacturer:'Anvil Aerospace',     manufacturer_short:'Anvil',    announced:'2020-01-01', announced_uncertain:true,  flyable_patch:'Arena Commander v1.0', flyable_date:'2015-04-01', flyable_uncertain:true,  status:'flyable'    },
  { id:'f8c-lightning-executive',  name:'F8C Lightning Executive Edition', manufacturer:'Anvil Aerospace',          manufacturer_short:'Anvil',    announced:'2018-10-10', announced_uncertain:true,  flyable_patch:'Alpha 3.9',            flyable_date:'2020-04-01', flyable_uncertain:true,  status:'flyable'    },
  { id:'valkyrie-liberator',       name:'Valkyrie Liberator Edition',      manufacturer:'Anvil Aerospace',          manufacturer_short:'Anvil',    announced:'2018-06-01', announced_uncertain:true,  flyable_patch:'Alpha 3.3',            flyable_date:'2018-10-10', flyable_uncertain:true,  status:'flyable'    },
  // Argo
  { id:'mole-carbon',              name:'Argo Mole Carbon Edition',        manufacturer:'Argo Astronautics',        manufacturer_short:'Argo',     announced:'2020-06-01', announced_uncertain:true,  flyable_patch:'Alpha 3.12',           flyable_date:'2020-12-01', flyable_uncertain:true,  status:'flyable'    },
  { id:'mole-talus',               name:'Argo Mole Talus Edition',         manufacturer:'Argo Astronautics',        manufacturer_short:'Argo',     announced:'2020-06-01', announced_uncertain:true,  flyable_patch:'Alpha 3.12',           flyable_date:'2020-12-01', flyable_uncertain:true,  status:'flyable'    },
  { id:'atls',                     name:'ATLS',                            manufacturer:'Argo Astronautics',        manufacturer_short:'Argo',     announced:'2024-01-01', announced_uncertain:true,  flyable_patch:null,                   flyable_date:null,         flyable_uncertain:false, status:'unreleased' },
  { id:'atls-geo',                 name:'ATLS GEO',                        manufacturer:'Argo Astronautics',        manufacturer_short:'Argo',     announced:'2024-01-01', announced_uncertain:true,  flyable_patch:null,                   flyable_date:null,         flyable_uncertain:false, status:'unreleased' },
  { id:'csv-sm',                   name:'CSV-SM',                          manufacturer:'Argo Astronautics',        manufacturer_short:'Argo',     announced:'2024-01-01', announced_uncertain:true,  flyable_patch:null,                   flyable_date:null,         flyable_uncertain:false, status:'unreleased' },
  // Consolidated Outland
  { id:'mustang-alpha-vindicator', name:'Mustang Alpha Vindicator',        manufacturer:'Consolidated Outland',     manufacturer_short:'C.O.',     announced:'2014-04-01', announced_uncertain:true,  flyable_patch:'Arena Commander v1.1', flyable_date:'2015-07-01', flyable_uncertain:true,  status:'flyable'    },
  // Drake
  { id:'golem',                    name:'Golem',                           manufacturer:'Drake Interplanetary',     manufacturer_short:'Drake',    announced:'2024-01-01', announced_uncertain:true,  flyable_patch:null,                   flyable_date:null,         flyable_uncertain:false, status:'unreleased' },
  { id:'golem-ox',                 name:'Golem OX',                        manufacturer:'Drake Interplanetary',     manufacturer_short:'Drake',    announced:'2024-01-01', announced_uncertain:true,  flyable_patch:null,                   flyable_date:null,         flyable_uncertain:false, status:'unreleased' },
  { id:'mule',                     name:'Mule',                            manufacturer:'Drake Interplanetary',     manufacturer_short:'Drake',    announced:'2021-06-01', announced_uncertain:true,  flyable_patch:'Alpha 3.17',           flyable_date:'2022-04-01', flyable_uncertain:true,  status:'flyable'    },
  // Esperia
  { id:'prowler-utility',          name:'Prowler Utility',                 manufacturer:'Esperia',                  manufacturer_short:'Esperia',  announced:'2017-10-01', announced_uncertain:true,  flyable_patch:'Alpha 3.7',            flyable_date:'2019-09-01', flyable_uncertain:true,  status:'flyable'    },
  { id:'stinger',                  name:'Stinger',                         manufacturer:'Esperia',                  manufacturer_short:'Esperia',  announced:'2022-01-01', announced_uncertain:true,  flyable_patch:null,                   flyable_date:null,         flyable_uncertain:false, status:'unreleased' },
  // Grey's Market
  { id:'shiv',                     name:'Shiv',                            manufacturer:"Grey's Market",            manufacturer_short:"Grey's",   announced:'2023-01-01', announced_uncertain:true,  flyable_patch:null,                   flyable_date:null,         flyable_uncertain:false, status:'unreleased' },
  // Greycat
  { id:'mdc',                      name:'MDC',                             manufacturer:'Greycat Industrial',       manufacturer_short:'Greycat',  announced:'2024-01-01', announced_uncertain:true,  flyable_patch:null,                   flyable_date:null,         flyable_uncertain:false, status:'unreleased' },
  { id:'mtc',                      name:'MTC',                             manufacturer:'Greycat Industrial',       manufacturer_short:'Greycat',  announced:'2024-01-01', announced_uncertain:true,  flyable_patch:null,                   flyable_date:null,         flyable_uncertain:false, status:'unreleased' },
  { id:'ptv',                      name:'PTV',                             manufacturer:'Greycat Industrial',       manufacturer_short:'Greycat',  announced:'2016-01-01', announced_uncertain:true,  flyable_patch:'Alpha 3.0',            flyable_date:'2017-12-23', flyable_uncertain:true,  status:'flyable'    },
  { id:'roc-ds',                   name:'ROC-DS',                          manufacturer:'Greycat Industrial',       manufacturer_short:'Greycat',  announced:'2020-04-01', announced_uncertain:true,  flyable_patch:'Alpha 3.12',           flyable_date:'2020-12-01', flyable_uncertain:true,  status:'flyable'    },
  { id:'utv',                      name:'UTV',                             manufacturer:'Greycat Industrial',       manufacturer_short:'Greycat',  announced:'2024-01-01', announced_uncertain:true,  flyable_patch:null,                   flyable_date:null,         flyable_uncertain:false, status:'unreleased' },
  // Kruger
  { id:'l21-wolf',                 name:'L-21 Wolf',                       manufacturer:'Kruger Intergalactic',     manufacturer_short:'Kruger',   announced:'2023-06-01', announced_uncertain:true,  flyable_patch:null,                   flyable_date:null,         flyable_uncertain:false, status:'unreleased' },
  { id:'l22-alpha-wolf',           name:'L-22 Alpha Wolf',                 manufacturer:'Kruger Intergalactic',     manufacturer_short:'Kruger',   announced:'2023-06-01', announced_uncertain:true,  flyable_patch:null,                   flyable_date:null,         flyable_uncertain:false, status:'unreleased' },
  { id:'p72-archimedes-emerald',   name:'P-72 Archimedes Emerald',         manufacturer:'Kruger Intergalactic',     manufacturer_short:'Kruger',   announced:'2018-06-01', announced_uncertain:true,  flyable_patch:'Alpha 3.5',            flyable_date:'2019-03-01', flyable_uncertain:true,  status:'flyable'    },
  // Mirai
  { id:'pulse',                    name:'Pulse',                           manufacturer:'Mirai',                    manufacturer_short:'Mirai',    announced:'2023-06-01', announced_uncertain:true,  flyable_patch:'Alpha 3.24',           flyable_date:'2024-09-01', flyable_uncertain:true,  status:'flyable'    },
  { id:'pulse-lx',                 name:'Pulse LX',                        manufacturer:'Mirai',                    manufacturer_short:'Mirai',    announced:'2023-06-01', announced_uncertain:true,  flyable_patch:'Alpha 3.24',           flyable_date:'2024-09-01', flyable_uncertain:true,  status:'flyable'    },
  // Origin
  { id:'g12',                      name:'G12',                             manufacturer:'Origin Jumpworks',         manufacturer_short:'Origin',   announced:'2019-01-01', announced_uncertain:true,  flyable_patch:'Alpha 3.10',           flyable_date:'2020-07-01', flyable_uncertain:true,  status:'flyable'    },
  { id:'g12a',                     name:'G12a',                            manufacturer:'Origin Jumpworks',         manufacturer_short:'Origin',   announced:'2019-01-01', announced_uncertain:true,  flyable_patch:'Alpha 3.10',           flyable_date:'2020-07-01', flyable_uncertain:true,  status:'flyable'    },
  { id:'g12r',                     name:'G12r',                            manufacturer:'Origin Jumpworks',         manufacturer_short:'Origin',   announced:'2019-01-01', announced_uncertain:true,  flyable_patch:'Alpha 3.10',           flyable_date:'2020-07-01', flyable_uncertain:true,  status:'flyable'    },
  { id:'x1',                       name:'X1',                              manufacturer:'Origin Jumpworks',         manufacturer_short:'Origin',   announced:'2021-01-01', announced_uncertain:true,  flyable_patch:'Alpha 3.22',           flyable_date:'2024-03-01', flyable_uncertain:true,  status:'flyable'    },
  { id:'x1-velocity',              name:'X1 Velocity',                     manufacturer:'Origin Jumpworks',         manufacturer_short:'Origin',   announced:'2021-01-01', announced_uncertain:true,  flyable_patch:'Alpha 3.22',           flyable_date:'2024-03-01', flyable_uncertain:true,  status:'flyable'    },
  // RSI
  { id:'aurora-mk1-se',            name:'Aurora Mk I SE',                  manufacturer:'Roberts Space Industries', manufacturer_short:'RSI',      announced:'2012-10-10', announced_uncertain:false, flyable_patch:'Arena Commander v0.8', flyable_date:'2014-06-04', flyable_uncertain:true,  status:'flyable'    },
  { id:'aurora-mk2',               name:'Aurora Mk II',                    manufacturer:'Roberts Space Industries', manufacturer_short:'RSI',      announced:'2024-01-01', announced_uncertain:true,  flyable_patch:null,                   flyable_date:null,         flyable_uncertain:false, status:'unreleased' },
  { id:'constellation-phoenix-emerald', name:'Constellation Phoenix Emerald', manufacturer:'Roberts Space Industries', manufacturer_short:'RSI', announced:'2014-01-01', announced_uncertain:true, flyable_patch:'Alpha 3.6', flyable_date:'2019-06-01', flyable_uncertain:true, status:'flyable' },
  { id:'lynx',                     name:'Lynx',                            manufacturer:'Roberts Space Industries', manufacturer_short:'RSI',      announced:'2017-01-01', announced_uncertain:true,  flyable_patch:'Alpha 3.2',            flyable_date:'2018-06-01', flyable_uncertain:true,  status:'flyable'    },
  { id:'ursa',                     name:'Ursa',                            manufacturer:'Roberts Space Industries', manufacturer_short:'RSI',      announced:'2016-01-01', announced_uncertain:true,  flyable_patch:'Alpha 2.0',            flyable_date:'2015-12-11', flyable_uncertain:true,  status:'flyable'    },
  { id:'ursa-fortuna',             name:'Ursa Fortuna',                    manufacturer:'Roberts Space Industries', manufacturer_short:'RSI',      announced:'2016-01-01', announced_uncertain:true,  flyable_patch:'Alpha 2.0',            flyable_date:'2015-12-11', flyable_uncertain:true,  status:'flyable'    },
  { id:'ursa-medivac',             name:'Ursa Medivac',                    manufacturer:'Roberts Space Industries', manufacturer_short:'RSI',      announced:'2020-01-01', announced_uncertain:true,  flyable_patch:'Alpha 3.15',           flyable_date:'2021-10-01', flyable_uncertain:true,  status:'flyable'    },
  // Tumbril
  { id:'cyclone-mt',               name:'Cyclone MT',                      manufacturer:'Tumbril Land Systems',     manufacturer_short:'Tumbril',  announced:'2018-06-01', announced_uncertain:true,  flyable_patch:'Alpha 3.5',            flyable_date:'2019-03-01', flyable_uncertain:true,  status:'flyable'    },
  { id:'cyclone-rn',               name:'Cyclone RN',                      manufacturer:'Tumbril Land Systems',     manufacturer_short:'Tumbril',  announced:'2018-06-01', announced_uncertain:true,  flyable_patch:'Alpha 3.5',            flyable_date:'2019-03-01', flyable_uncertain:true,  status:'flyable'    },
  { id:'ranger-cv',                name:'Ranger CV',                       manufacturer:'Tumbril Land Systems',     manufacturer_short:'Tumbril',  announced:'2018-01-01', announced_uncertain:true,  flyable_patch:'Alpha 3.8',            flyable_date:'2019-12-20', flyable_uncertain:true,  status:'flyable'    },
  { id:'ranger-rc',                name:'Ranger RC',                       manufacturer:'Tumbril Land Systems',     manufacturer_short:'Tumbril',  announced:'2018-01-01', announced_uncertain:true,  flyable_patch:'Alpha 3.8',            flyable_date:'2019-12-20', flyable_uncertain:true,  status:'flyable'    },
  { id:'ranger-tr',                name:'Ranger TR',                       manufacturer:'Tumbril Land Systems',     manufacturer_short:'Tumbril',  announced:'2018-01-01', announced_uncertain:true,  flyable_patch:'Alpha 3.8',            flyable_date:'2019-12-20', flyable_uncertain:true,  status:'flyable'    },
  { id:'storm-aa',                 name:'Storm AA',                        manufacturer:'Tumbril Land Systems',     manufacturer_short:'Tumbril',  announced:'2021-10-01', announced_uncertain:true,  flyable_patch:'Alpha 3.17',           flyable_date:'2022-04-01', flyable_uncertain:true,  status:'flyable'    },
];

let added = 0;
for (const ship of add) {
  if (!existing.has(ship.id)) {
    ships.push(ship);
    existing.add(ship.id);
    added++;
  }
}

fs.writeFileSync(dataPath, JSON.stringify(ships, null, 2));
console.log('Name fixes applied. ' + added + ' ships added. Total: ' + ships.length);
