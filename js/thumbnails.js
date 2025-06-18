import { getById } from './utils.js';
import { groupBy } from './utils.js';

// Render thumbnail cards grouped by FrameName
export function renderThumbnails(frames) {
  const container = getById('thumbnails');
  container.innerHTML = '';

  const groups = groupBy(frames, f=>f.FrameName);
  const frameNames = Object.keys(groups).sort();

  frameNames.forEach(name => {
    const skus = groups[name];
    // pick representative image
    const rep = skus.find(s=>s.HeroImage && !s.HeroImage.includes('coming-soon')) || {};
    const img = rep.HeroImage ? `images/${rep.HeroImage}` : 'images/coming-soon.jpg';
    const isSafety = skus.some(s=>s.Material.toLowerCase()==='safety');
    const isSport  = skus.some(s=>s.Material.toLowerCase()==='sport');

    const tpl = getById('thumbnail-template').content.cloneNode(true);
    const link = tpl.querySelector('.thumb-link');
    const imgEl = tpl.querySelector('.thumb-img');
    const label = tpl.querySelector('.thumb-label');
    const nameEl = tpl.querySelector('.thumb-name');

    link.href = `details.html?frame=${encodeURIComponent(name)}`;
    imgEl.src = img;
    imgEl.alt = name;
    nameEl.textContent = name;
    label.textContent = isSafety ? 'SAFETY' : isSport ? 'SPORT' : '';

    container.appendChild(tpl);
  });
}