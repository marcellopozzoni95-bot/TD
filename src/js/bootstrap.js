import { Init } from './game/Init.js';
import { loadData } from './file/data.js';

document.addEventListener('DOMContentLoaded', () => {
      document.addEventListener('contextmenu', event => event.preventDefault());
      document.addEventListener('dragstart', event => event.preventDefault());
      window.__diag && __diag('JS avviato');
      const data = loadData();
      new Init(data);
});

