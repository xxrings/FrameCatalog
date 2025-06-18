import { fetchFramesData } from './data-loader.js';
import { buildFilterControls } from './filters.js';
import { renderThumbnails } from './thumbnails.js';
import { hookFilterEvents } from './events.js';

export async function initCatalogPage() {
  try {
    const frames = await fetchFramesData();
    buildFilterControls(frames);
    renderThumbnails(frames);
    hookFilterEvents(frames);
  } catch (err) {
    console.error(err);
    document.getElementById('thumbnails').innerHTML = '<p class="error">Failed to load catalog.</p>';
  }
}