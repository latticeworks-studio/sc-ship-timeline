# Maintenance Guide

## Adding a new ship (or marking one as flyable)

Open a terminal in this folder and run:

```
node scripts/add-ship.js
```

The script will prompt you for:
- Ship name (exact, as CIG lists it)
- Manufacturer full name (e.g. `Anvil Aerospace`)
- Flyable patch (e.g. `Alpha 4.3`)
- Flyable date (`YYYY-MM-DD`)
- Role (`fighter`, `exploration`, `freight`, `mining`, `salvage`, `support`, `dropship`, `racing`, `capital`, `ground`)
- Announced date (optional — press Enter to use the flyable date)

It updates `data/ships.json` and `data/meta.json` automatically.

After running, commit and push:

```
git add data/ships.json data/meta.json
git commit -m "Add [Ship Name] — Alpha X.X (YYYY-MM-DD)"
git push
```

The site will update within a minute or two via GitHub Pages.
