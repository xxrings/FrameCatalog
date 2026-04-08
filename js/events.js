import { getById } from './utils.js';

export function hookFilterEvents(syncCatalog) {
  const form = getById('catalog-controls');

  const handleChange = event => {
    if (event.target.matches('input, select')) syncCatalog();
  };

  form.addEventListener('input', handleChange);
  form.addEventListener('change', handleChange);

  getById('filter-clear').addEventListener('click', () => {
    form.reset();
    syncCatalog();
  });
}
