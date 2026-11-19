import { Init } from './game/Init.js';
import { loadData } from './file/data.js';

const __boot = () => {
      document.addEventListener('contextmenu', event => event.preventDefault());
      document.addEventListener('dragstart', event => event.preventDefault());
      window.__diag && __diag('JS avviato');
      const data = loadData();
      new Init(data);
};
if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', __boot); else __boot();
