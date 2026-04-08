import { getById, clearChildren, formatList } from './utils.js';
import { describeActiveFilters } from './filters.js';

function setImageFallback(imgEl) {
  imgEl.addEventListener(
    'error',
    () => {
      imgEl.src = 'images/coming-soon.jpg';
    },
    { once: true }
  );
}

function renderActiveFilters(state) {
  const container = getById('active-filters');
  clearChildren(container);

  const chips = describeActiveFilters(state);
  if (!chips.length) {
    const chip = document.createElement('span');
    chip.className = 'active-filter-chip active-filter-chip--muted';
    chip.textContent = 'Showing all current frame styles';
    container.appendChild(chip);
    return;
  }

  chips.forEach(label => {
    const chip = document.createElement('span');
    chip.className = 'active-filter-chip';
    chip.textContent = label;
    container.appendChild(chip);
  });
}

function renderEmptyState(container) {
  container.innerHTML = `
    <div class="empty-state">
      <h3>No frames match these filters</h3>
      <p>Try clearing one or two filters, or search with a broader term such as a color family or measurement.</p>
    </div>
  `;
}

function renderFact(list, label, value) {
  const item = document.createElement('li');
  item.innerHTML = `<strong>${label}:</strong> ${value}`;
  list.appendChild(item);
}

function appendChip(container, label) {
  const chip = document.createElement('span');
  chip.className = 'catalog-chip';
  chip.textContent = label;
  container.appendChild(chip);
}

export function renderThumbnails(items, totalCount, state) {
  const container = getById('thumbnails');
  const summary = getById('results-summary');
  summary.textContent = `Showing ${items.length} of ${totalCount} frame styles`;
  renderActiveFilters(state);

  clearChildren(container);
  if (!items.length) {
    renderEmptyState(container);
    return;
  }

  items.forEach(item => {
    const tpl = getById('thumbnail-template').content.cloneNode(true);
    const link = tpl.querySelector('.catalog-card__link');
    const imgEl = tpl.querySelector('.catalog-card__image');
    const status = tpl.querySelector('.catalog-card__status');
    const eyebrow = tpl.querySelector('.catalog-card__eyebrow');
    const title = tpl.querySelector('.catalog-card__title');
    const summaryText = tpl.querySelector('.catalog-card__summary');
    const facts = tpl.querySelector('.catalog-card__facts');
    const chips = tpl.querySelector('.catalog-card__chips');

    link.href = `details.html?frame=${encodeURIComponent(item.name)}`;
    imgEl.src = item.image;
    imgEl.alt = item.imageAlt;
    setImageFallback(imgEl);

    status.textContent = item.statusLabel || (item.types[0] !== 'Standard' ? item.types.join(' / ') : '');
    eyebrow.textContent = item.materialLabel;
    title.textContent = item.name;
    summaryText.textContent = item.summary;

    renderFact(facts, 'Eye sizes', formatList(item.eyeSizes.map(String), 4));
    renderFact(facts, 'Frame PD', formatList(item.pds.map(String), 4));
    renderFact(facts, 'Temple', formatList(item.temples.map(value => `${value} mm`), 3));

    item.types
      .filter(type => type !== 'Standard')
      .forEach(type => appendChip(chips, type));

    item.colors.slice(0, 4).forEach(color => appendChip(chips, color));
    if (item.colors.length > 4) appendChip(chips, `+${item.colors.length - 4} more colors`);

    container.appendChild(tpl);
  });
}
