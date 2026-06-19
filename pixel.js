'use strict';

(function () {
  const FONT = {
    'C': [[0,1,1,1,0],[1,0,0,0,0],[1,0,0,0,0],[1,0,0,0,0],[0,1,1,1,0]],
    'E': [[1,1,1,1,1],[1,0,0,0,0],[1,1,1,1,0],[1,0,0,0,0],[1,1,1,1,1]],
    'H': [[1,0,0,0,1],[1,0,0,0,1],[1,1,1,1,1],[1,0,0,0,1],[1,0,0,0,1]],
    'I': [[1,1,1,1,1],[0,0,1,0,0],[0,0,1,0,0],[0,0,1,0,0],[1,1,1,1,1]],
    'L': [[1,0,0,0,0],[1,0,0,0,0],[1,0,0,0,0],[1,0,0,0,0],[1,1,1,1,1]],
    'M': [[1,0,0,0,1],[1,1,0,1,1],[1,0,1,0,1],[1,0,0,0,1],[1,0,0,0,1]],
    'N': [[1,0,0,0,1],[1,1,0,0,1],[1,0,1,0,1],[1,0,0,1,1],[1,0,0,0,1]],
    'P': [[1,1,1,1,0],[1,0,0,0,1],[1,1,1,1,0],[1,0,0,0,0],[1,0,0,0,0]],
    'S': [[0,1,1,1,1],[1,0,0,0,0],[0,1,1,1,0],[0,0,0,0,1],[1,1,1,1,0]],
    'T': [[1,1,1,1,1],[0,0,1,0,0],[0,0,1,0,0],[0,0,1,0,0],[0,0,1,0,0]],
    ' ': [[0,0,0,0,0],[0,0,0,0,0],[0,0,0,0,0],[0,0,0,0,0],[0,0,0,0,0]],
  };

  function render(el) {
    const text = (el.dataset.pixelText || '').toUpperCase();
    const chars = text.split('').filter(c => c in FONT);
    el.classList.add('px-text');
    for (let row = 0; row < 5; row++) {
      const rowEl = document.createElement('div');
      rowEl.className = 'px-row';
      chars.forEach(ch => {
        const charEl = document.createElement('div');
        charEl.className = 'px-char';
        FONT[ch][row].forEach(on => {
          const cell = document.createElement('div');
          cell.className = on ? 'px-cell on' : 'px-cell';
          charEl.appendChild(cell);
        });
        rowEl.appendChild(charEl);
      });
      el.appendChild(rowEl);
    }
  }

  document.querySelectorAll('[data-pixel-text]').forEach(render);
})();
