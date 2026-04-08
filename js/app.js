import { fetchFramesData } from './data-loader.js';
import { buildCatalogItems, filterCatalogItems, getFilterOptions, sortCatalogItems } from './catalog-model.js';
import { buildFilterControls, getFilterState } from './filters.js';
import { renderThumbnails } from './thumbnails.js';
import { hookFilterEvents } from './events.js';

export async function initCatalogPage() {
  try {
    const frames = await fetchFramesData();
    const items = buildCatalogItems(frames);
    const filterOptions = getFilterOptions(items);

    buildFilterControls(filterOptions);

    const syncCatalog = () => {
      const state = getFilterState();
      const filtered = filterCatalogItems(items, state);
      const sorted = sortCatalogItems(filtered, state.sortBy);
      renderThumbnails(sorted, items.length, state);
    };

    syncCatalog();
    hookFilterEvents(syncCatalog);
  } catch (err) {
    console.error(err);
    document.getElementById('thumbnails').innerHTML =
      '<div class="empty-state"><h3>Catalog unavailable</h3><p>Failed to load the current frame selection.</p></div>';
  }
}
